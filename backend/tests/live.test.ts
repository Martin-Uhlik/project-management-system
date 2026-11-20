import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io as connect, type Socket } from 'socket.io-client';
import { attachLive, closeLive, LIVE_EVENT, LIVE_PATH } from '../src/live.ts';
import { createProject, createTask, makeApp, ORIGIN, PASSWORD, prisma, resetDb, signInAll } from './helpers.ts';

const app = makeApp();
const server = http.createServer(app);
let url = '';
let s: Awaited<ReturnType<typeof signInAll>>;
const sockets: Socket[] = [];

beforeAll(async () => {
    attachLive(server, [ORIGIN]);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    url = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
    await closeLive();
});

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
});

afterEach(() => {
    for (const socket of sockets.splice(0)) socket.disconnect();
});

// A new session of the user (like another browser), as its session cookie
const sessionCookie = async (user: { UserName: string }) => {
    const res = await request(app).post('/login').set('Origin', ORIGIN).send({ name: user.UserName, password: PASSWORD });
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((value) => value.startsWith('auth='));
    if (!cookie) throw new Error('no session cookie');
    return cookie.split(';')[0];
};

type Client = { socket: Socket; topics: string[]; waitFor: (topic: string) => Promise<void> };

const open = (headers: Record<string, string>) => {
    const socket = connect(url, { path: LIVE_PATH, transports: ['websocket'], extraHeaders: headers, reconnection: false, forceNew: true });
    sockets.push(socket);
    return socket;
};

// Connects as the user and records every topic it is told about
const listen = async (user: { UserName: string }): Promise<Client> => {
    const socket = open({ cookie: await sessionCookie(user) });
    const topics: string[] = [];
    const waiters: { topic: string; resolve: () => void }[] = [];
    socket.on(LIVE_EVENT, (changed: string[]) => {
        topics.push(...changed);
        for (const waiter of waiters.filter((waiter) => changed.includes(waiter.topic))) waiter.resolve();
    });
    await new Promise<void>((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', reject);
    });
    const waitFor = (topic: string) =>
        topics.includes(topic)
            ? Promise.resolve()
            : new Promise<void>((resolve, reject) => {
                  const timer = setTimeout(() => reject(new Error(`no "${topic}" (got ${JSON.stringify(topics)})`)), 3000);
                  waiters.push({ topic, resolve: () => (clearTimeout(timer), resolve()) });
              });
    return { socket, topics, waitFor };
};

// events reach every client at about the same time: after one arrived, give the others a moment
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

const connectError = (socket: Socket) =>
    new Promise<Error | null>((resolve) => {
        socket.on('connect', () => resolve(null));
        socket.on('connect_error', resolve);
    });

describe('live updates', () => {
    it('need a valid session and an allowed origin', async () => {
        expect((await connectError(open({})))?.message).toBe('unauthorized');
        expect((await connectError(open({ cookie: 'auth=nonsense' })))?.message).toBe('unauthorized');
        const cookie = await sessionCookie(s.user.user);
        expect(await connectError(open({ cookie, origin: 'https://evil.example' }))).not.toBeNull();
        expect(await connectError(open({ cookie, origin: ORIGIN }))).toBeNull();
    });

    it("tell about a project's tasks only those who may open the project", async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const [admin, member, outsider] = await Promise.all([listen(s.admin.user), listen(s.user.user), listen(s.other.user)]);

        const res = await s.manager.agent.patch(`/auth/projects/${project.ID}/tasks/${task.ID}`).set('Origin', ORIGIN).send({ Name: 'Renamed' });
        expect(res.status).toBe(200);
        await Promise.all([admin.waitFor(`project:${project.ID}`), member.waitFor(`project:${project.ID}`), outsider.waitFor('projects')]);
        await settle();
        expect(outsider.topics).not.toContain(`project:${project.ID}`);
    });

    it('tell a newly assigned worker and the one taken off the task', async () => {
        const project = await createProject(s.manager.user.ID);
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        const [before, after] = await Promise.all([listen(s.user.user), listen(s.other.user)]);

        const res = await s.manager.agent
            .patch(`/auth/projects/${project.ID}/tasks/${task.ID}`)
            .set('Origin', ORIGIN)
            .send({ Members: [{ UserID: s.other.user.ID }] });
        expect(res.status).toBe(200);
        await Promise.all([before.waitFor(`user:${s.user.user.ID}`), after.waitFor(`user:${s.other.user.ID}`)]);
        await after.waitFor(`project:${project.ID}`);
    });

    it("tell about a worker's time the worker, their managers and admins only", async () => {
        await prisma.user.update({ where: { ID: s.user.user.ID }, data: { ManagerID: s.manager.user.ID } });
        const [worker, manager, admin, other] = await Promise.all([listen(s.user.user), listen(s.manager.user), listen(s.admin.user), listen(s.other.user)]);

        const time = { WorkStartTime: '2026-01-05T08:00:00Z', WorkStopTime: '2026-01-05T16:00:00Z' };
        expect((await s.user.agent.post(`/auth/users/timer/${s.user.user.ID}`).set('Origin', ORIGIN).send(time)).status).toBe(200);
        const topic = `user:${s.user.user.ID}`;
        await Promise.all([worker.waitFor(topic), manager.waitFor(topic), admin.waitFor(topic), other.waitFor('users')]);
        await settle();
        expect(other.topics).not.toContain(topic);
    });

    it('tell about a stopped timer the project of the task it ran on', async () => {
        const project = await createProject(s.manager.user.ID);
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        await prisma.user.update({ where: { ID: s.user.user.ID }, data: { WorkStartTime: new Date(), CurrentTaskID: task.ID } });
        const manager = await listen(s.manager.user);

        const time = { WorkStartTime: '2026-01-05T08:00:00Z', WorkStopTime: '2026-01-05T16:00:00Z' };
        expect((await s.user.agent.post(`/auth/users/timer/${s.user.user.ID}`).set('Origin', ORIGIN).send(time)).status).toBe(200);
        await Promise.all([manager.waitFor(`project:${project.ID}`), manager.waitFor('projects')]);
    });

    it('keep personal tasks to their owner', async () => {
        const [owner, admin] = await Promise.all([listen(s.user.user), listen(s.admin.user)]);
        const task = { Name: 'Call supplier', Description: '', FinishDate: '2026-02-01T10:00:00Z' };
        expect((await s.user.agent.post(`/auth/${s.user.user.ID}/personal-tasks`).set('Origin', ORIGIN).send({ task })).status).toBe(200);
        await owner.waitFor(`personal-tasks:${s.user.user.ID}`);
        // a refused request publishes nothing
        expect((await s.other.agent.post(`/auth/${s.user.user.ID}/personal-tasks`).set('Origin', ORIGIN).send({ task })).status).toBe(403);
        await settle();
        expect(admin.topics).toEqual([]);
        expect(owner.topics).toEqual([`personal-tasks:${s.user.user.ID}`]);
    });

    it("don't tell the connection that made the change", async () => {
        const [self, otherTab] = await Promise.all([listen(s.admin.user), listen(s.admin.user)]);
        const res = await s.admin.agent
            .post('/auth/machines')
            .set('Origin', ORIGIN)
            .set('X-Socket-ID', self.socket.id ?? '')
            .send({ Name: 'Lathe' });
        expect(res.status).toBe(200);
        await otherTab.waitFor('machines');
        await settle();
        expect(self.topics).toEqual([]);
    });

    it('ignore an X-Socket-ID of another user', async () => {
        const victim = await listen(s.user.user);
        await s.admin.agent
            .post('/auth/machines')
            .set('Origin', ORIGIN)
            .set('X-Socket-ID', victim.socket.id ?? '')
            .send({ Name: 'Lathe' });
        await victim.waitFor('machines');
    });

    it('close the connections of a user who is blocked', async () => {
        const blocked = await listen(s.user.user);
        const closed = new Promise<string>((resolve) => blocked.socket.on('disconnect', resolve));
        expect((await s.admin.agent.patch(`/auth/users/${s.user.user.ID}`).set('Origin', ORIGIN).send({ Enabled: false })).status).toBe(200);
        expect(await closed).toBe('io server disconnect');
    });

    it('move a user to the rooms of a new role', async () => {
        const project = await createProject(s.admin.user.ID);
        const promoted = await listen(s.other.user);
        expect((await s.admin.agent.patch(`/auth/users/${s.other.user.ID}`).set('Origin', ORIGIN).send({ UserType: 'MANAGER' })).status).toBe(200);
        await settle();
        expect(promoted.socket.connected).toBe(true);
        await s.admin.agent.patch(`/auth/projects/${project.ID}`).set('Origin', ORIGIN).send({ Name: 'Renamed' });
        await promoted.waitFor(`project:${project.ID}`);
    });

    it('close the connection of a session that signs out', async () => {
        const cookie = await sessionCookie(s.user.user);
        const other = open({ cookie });
        await connectError(other);
        const kept = await listen(s.user.user);
        const closed = new Promise<string>((resolve) => other.on('disconnect', resolve));
        // sign out with the session the connection "other" uses
        expect((await request(app).post('/auth/logout').set('Origin', ORIGIN).set('Cookie', cookie)).status).toBe(200);
        expect(await closed).toBe('io server disconnect');
        expect(kept.socket.connected).toBe(true);
    });
});
