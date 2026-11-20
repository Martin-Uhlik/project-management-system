import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { io as connect, type Socket } from 'socket.io-client';
import { attachLive, CHAT_EVENT, closeLive, LIVE_EVENT, LIVE_PATH } from '../src/live.ts';
import { MAX_MESSAGE_LENGTH } from '../src/resources/chat.ts';
import { createProject, createTask, createUser, loginAs, makeApp, ORIGIN, PASSWORD, prisma, resetDb, signInAll } from './helpers.ts';

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

type Agent = Awaited<ReturnType<typeof loginAs>>;

const send = (agent: Agent, path: string, Text: string) => agent.post(`/auth/chat/${path}/messages`).set('Origin', ORIGIN).send({ Text });
const read = (agent: Agent, path: string, body: object = {}) => agent.post(`/auth/chat/${path}/read`).set('Origin', ORIGIN).send(body);
const conversations = async (agent: Agent) => {
    const res = await agent.get('/auth/chat');
    expect(res.status).toBe(200);
    return res.body as {
        Unread: number;
        Users: { User: { ID: number }; Unread: number; LastMessage: { Text: string; Sender: { ID: number } } | null }[];
        Projects: { Project: { ID: number }; Unread: number; LastMessage: { Text: string } | null }[];
    };
};

// A live connection of the user that records the chat messages and topics it gets
const listen = async (user: { UserName: string }) => {
    const res = await request(app).post('/login').set('Origin', ORIGIN).send({ name: user.UserName, password: PASSWORD });
    const cookie = ([] as string[])
        .concat(res.headers['set-cookie'] ?? [])
        .find((value) => value.startsWith('auth='))!
        .split(';')[0];
    const socket = connect(url, { path: LIVE_PATH, transports: ['websocket'], extraHeaders: { cookie }, reconnection: false, forceNew: true });
    sockets.push(socket);
    const messages: { ID?: number; Text?: string; Read?: unknown }[] = [];
    const topics: string[] = [];
    socket.on(CHAT_EVENT, (message) => messages.push(message));
    socket.on(LIVE_EVENT, (changed: string[]) => topics.push(...changed));
    await new Promise<void>((resolve, reject) => {
        socket.on('connect', resolve);
        socket.on('connect_error', reject);
    });
    return { socket, messages, topics };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

describe('direct messages', () => {
    it('sends a message, counts it unread for the recipient until read', async () => {
        const to = `users/${s.other.user.ID}`;
        const sent = await send(s.user.agent, to, '  Ahoj, máš chvilku?  ');
        expect(sent.status).toBe(200);
        expect(sent.body).toMatchObject({ Text: 'Ahoj, máš chvilku?', SenderID: s.user.user.ID, RecipientID: s.other.user.ID, ProjectID: null });
        expect(sent.body.Sender).toEqual({ ID: s.user.user.ID, FirstName: 'Test', LastName: 'USER' });

        const theirs = await conversations(s.other.agent);
        expect(theirs.Unread).toBe(1);
        const withSender = theirs.Users.find((conversation) => conversation.User.ID === s.user.user.ID)!;
        expect(withSender).toMatchObject({ Unread: 1, LastMessage: { Text: 'Ahoj, máš chvilku?', Sender: { ID: s.user.user.ID } } });

        // the sender has read their own message
        expect((await conversations(s.user.agent)).Unread).toBe(0);

        const messages = await s.other.agent.get(`/auth/chat/users/${s.user.user.ID}/messages`);
        expect(messages.status).toBe(200);
        expect(messages.body.Messages.map((message: { Text: string }) => message.Text)).toEqual(['Ahoj, máš chvilku?']);
        expect(messages.body.PartnerLastReadID).toBe(sent.body.ID);

        expect((await read(s.other.agent, `users/${s.user.user.ID}`)).status).toBe(200);
        expect((await conversations(s.other.agent)).Unread).toBe(0);
    });

    it('lists every other user, not deleted ones and not oneself', async () => {
        const deleted = await createUser('USER');
        await prisma.user.update({ where: { ID: deleted.ID }, data: { Deleted: true } });
        const ids = (await conversations(s.user.agent)).Users.map((conversation) => conversation.User.ID).sort();
        expect(ids).toEqual([s.admin.user.ID, s.manager.user.ID, s.other.user.ID].sort());
    });

    it('keeps a conversation between its two users', async () => {
        await send(s.user.agent, `users/${s.other.user.ID}`, 'tajné');
        const outsider = await s.manager.agent.get(`/auth/chat/users/${s.other.user.ID}/messages`);
        expect(outsider.body.Messages).toEqual([]);
        expect((await conversations(s.manager.agent)).Unread).toBe(0);
    });

    it('refuses messages to oneself, to deleted users and empty or too long ones', async () => {
        expect((await send(s.user.agent, `users/${s.user.user.ID}`, 'já')).status).toBe(400);
        const deleted = await createUser('USER');
        await prisma.user.update({ where: { ID: deleted.ID }, data: { Deleted: true } });
        expect((await send(s.user.agent, `users/${deleted.ID}`, 'haló')).status).toBe(404);
        expect((await send(s.user.agent, 'users/999999', 'haló')).status).toBe(404);
        expect((await send(s.user.agent, `users/${s.other.user.ID}`, '   ')).status).toBe(400);
        expect((await send(s.user.agent, `users/${s.other.user.ID}`, 'x'.repeat(MAX_MESSAGE_LENGTH + 1))).status).toBe(400);
        expect(await prisma.chatMessage.count()).toBe(0);
    });

    it('needs a session', async () => {
        expect((await request(app).get('/auth/chat')).status).toBe(401);
        expect((await request(app).post(`/auth/chat/users/${s.other.user.ID}/messages`).set('Origin', ORIGIN).send({ Text: 'x' })).status).toBe(401);
    });

    it('moves the read marker only forward', async () => {
        const to = `users/${s.other.user.ID}`;
        const first = await send(s.user.agent, to, 'první');
        await send(s.user.agent, to, 'druhá');
        await read(s.other.agent, `users/${s.user.user.ID}`);
        await read(s.other.agent, `users/${s.user.user.ID}`, { LastReadID: first.body.ID });
        expect((await conversations(s.other.agent)).Unread).toBe(0);

        await send(s.user.agent, to, 'třetí');
        await send(s.user.agent, to, 'čtvrtá');
        expect((await conversations(s.other.agent)).Unread).toBe(2);
    });

    it('pages back through older messages', async () => {
        const to = `users/${s.other.user.ID}`;
        for (let index = 1; index <= 5; index += 1) await send(s.user.agent, to, `zpráva ${index}`);
        const newest = await s.user.agent.get(`/auth/chat/${to}/messages?limit=2`);
        expect(newest.body.Messages.map((message: { Text: string }) => message.Text)).toEqual(['zpráva 4', 'zpráva 5']);
        expect(newest.body.HasMore).toBe(true);
        const older = await s.user.agent.get(`/auth/chat/${to}/messages?limit=3&before=${newest.body.Messages[0].ID}`);
        expect(older.body.Messages.map((message: { Text: string }) => message.Text)).toEqual(['zpráva 1', 'zpráva 2', 'zpráva 3']);
        expect(older.body.HasMore).toBe(false);
    });
});

describe('project chats', () => {
    it('belongs to the owner, members and assignees; others are refused', async () => {
        const owner = await createUser('USER');
        const member = await createUser('USER');
        const assignee = await createUser('USER');
        const project = await createProject(owner.ID, [member.ID]);
        await createTask(project.ID, owner.ID, [assignee.ID]);
        const path = `projects/${project.ID}`;

        for (const person of [owner, member, assignee]) {
            const agent = await loginAs(app, person);
            expect((await send(agent, path, `od ${person.UserName}`)).status).toBe(200);
            expect((await conversations(agent)).Projects.map((conversation) => conversation.Project.ID)).toEqual([project.ID]);
        }

        expect((await send(s.other.agent, path, 'cizí')).status).toBe(403);
        expect((await s.other.agent.get(`/auth/chat/${path}/messages`)).status).toBe(403);
        expect((await read(s.other.agent, path)).status).toBe(403);
        expect((await conversations(s.other.agent)).Projects).toEqual([]);

        const ownerAgent = await loginAs(app, owner);
        const messages = await ownerAgent.get(`/auth/chat/${path}/messages`);
        expect(messages.body.Messages.map((message: { Text: string }) => message.Text)).toEqual([
            `od ${owner.UserName}`,
            `od ${member.UserName}`,
            `od ${assignee.UserName}`,
        ]);
        // the owner wrote first, so the two later messages are unread for them
        expect((await conversations(ownerAgent)).Projects[0]).toMatchObject({ Unread: 2, LastMessage: { Text: `od ${assignee.UserName}` } });
    });

    it('lets admins and managers open any project chat, which then stays in their list', async () => {
        const project = await createProject(s.user.user.ID);
        const path = `projects/${project.ID}`;
        await send(s.user.agent, path, 'ahoj');
        expect((await conversations(s.manager.agent)).Projects).toEqual([]);

        expect((await s.manager.agent.get(`/auth/chat/${path}/messages`)).status).toBe(200);
        expect((await read(s.manager.agent, path)).status).toBe(200);
        expect((await conversations(s.manager.agent)).Projects.map((conversation) => conversation.Project.ID)).toEqual([project.ID]);
        expect((await send(s.admin.agent, path, 'od admina')).status).toBe(200);
    });

    it('closes the chat of a deleted project and of a project the user left', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const path = `projects/${project.ID}`;
        await send(s.user.agent, path, 'ahoj');

        await prisma.user_Project.deleteMany({ where: { ProjectID: project.ID, UserID: s.user.user.ID } });
        expect((await send(s.user.agent, path, 'ještě')).status).toBe(403);
        expect((await conversations(s.user.agent)).Projects).toEqual([]);

        await prisma.project.update({ where: { ID: project.ID }, data: { Deleted: true } });
        expect((await send(s.manager.agent, path, 'konec')).status).toBe(404);
        expect((await conversations(s.manager.agent)).Projects).toEqual([]);
    });
});

describe('live chat', () => {
    it('pushes a direct message to both users, not to others', async () => {
        const recipient = await listen(s.other.user);
        const sender = await listen(s.user.user);
        const outsider = await listen(s.manager.user);
        const sent = await send(s.user.agent, `users/${s.other.user.ID}`, 'živě');
        await settle();
        expect(recipient.messages).toMatchObject([{ ID: sent.body.ID, Text: 'živě' }]);
        expect(sender.messages).toMatchObject([{ ID: sent.body.ID }]);
        expect(outsider.messages).toEqual([]);
    });

    it('pushes a project message to the people in the project and managers who opened it', async () => {
        const assignee = await createUser('USER');
        const project = await createProject(s.user.user.ID);
        await createTask(project.ID, s.user.user.ID, [assignee.ID]);
        await read(s.admin.agent, `projects/${project.ID}`);

        const assigneeLive = await listen(assignee);
        const adminLive = await listen(s.admin.user);
        const managerLive = await listen(s.manager.user);
        const outsiderLive = await listen(s.other.user);
        await send(s.user.agent, `projects/${project.ID}`, 'porada v 10');
        await settle();
        expect(assigneeLive.messages).toMatchObject([{ Text: 'porada v 10', ProjectID: project.ID }]);
        expect(adminLive.messages).toMatchObject([{ Text: 'porada v 10' }]);
        expect(managerLive.messages).toEqual([]);
        expect(outsiderLive.messages).toEqual([]);
    });

    it('tells the reader’s other tabs and the partner when a conversation was read', async () => {
        await send(s.user.agent, `users/${s.other.user.ID}`, 'přečti si to');
        const readerTab = await listen(s.other.user);
        const partner = await listen(s.user.user);
        await read(s.other.agent, `users/${s.user.user.ID}`);
        await settle();
        expect(readerTab.topics).toContain(`chat:${s.other.user.ID}`);
        expect(partner.messages).toMatchObject([{ Read: { ReaderID: s.other.user.ID, PartnerID: s.user.user.ID } }]);
        expect(partner.topics).not.toContain(`chat:${s.other.user.ID}`);
    });
});
