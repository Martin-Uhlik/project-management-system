import { beforeEach, describe, expect, it } from 'vitest';
import { makeApp, prisma, resetDb, signInAll } from './helpers.ts';

const app = makeApp();
let s: Awaited<ReturnType<typeof signInAll>>;

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
});

const newUser = { UserName: 'newbie', FirstName: 'New', LastName: 'User', Password: 'long enough', Position: 'Dev', UserType: 'USER' };

describe('creating users', () => {
    it('is for admins only', async () => {
        expect((await s.manager.agent.post('/auth/users').send({ user: newUser })).status).toBe(403);
        expect((await s.user.agent.post('/auth/users').send({ user: newUser })).status).toBe(403);
        expect((await s.admin.agent.post('/auth/users').send({ user: newUser })).status).toBe(200);
        const created = await prisma.user.findUniqueOrThrow({ where: { UserName: 'newbie' } });
        expect(created.PasswordHash).toMatch(/^scrypt\$/);
        expect(created.Enabled).toBe(true);
    });

    it('validates the fields and ignores unknown ones', async () => {
        expect((await s.admin.agent.post('/auth/users').send({ user: { ...newUser, UserType: 'GOD' } })).status).toBe(400);
        expect((await s.admin.agent.post('/auth/users').send({ user: { ...newUser, Password: 'short' } })).status).toBe(400);
        const res = await s.admin.agent.post('/auth/users').send({ user: { ...newUser, PasswordHash: 'x', Deleted: true } });
        expect(res.status).toBe(200);
        const created = await prisma.user.findUniqueOrThrow({ where: { UserName: 'newbie' } });
        expect(created.Deleted).toBe(false);
        expect(created.PasswordHash).not.toBe('x');
    });

    it('answers 409 for a taken user name', async () => {
        const res = await s.admin.agent.post('/auth/users').send({ user: { ...newUser, UserName: s.user.user.UserName } });
        expect(res.status).toBe(409);
    });
});

describe('reading users', () => {
    it('never sends password hashes', async () => {
        const list = await s.user.agent.get('/auth/users');
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(4);
        const one = await s.user.agent.get(`/auth/users/${s.admin.user.ID}`);
        expect(one.status).toBe(200);
        for (const body of [JSON.stringify(list.body), JSON.stringify(one.body)]) {
            expect(body).not.toContain('PasswordHash');
            expect(body).not.toContain('PasswordSalt');
        }
    });

    it('answers 404 for a missing user and 400 for a bad ID', async () => {
        expect((await s.user.agent.get('/auth/users/9999')).status).toBe(404);
        expect((await s.user.agent.get('/auth/users/abc')).status).toBe(400);
    });
});

describe('updating users', () => {
    it("doesn't let users make themselves admin or change anything but their timer", async () => {
        const me = s.user;
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ UserType: 'ADMIN' })).status).toBe(403);
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ PasswordHash: 'x' })).status).toBe(403);
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ FirstName: 'Hacker' })).status).toBe(403);
        expect((await s.manager.agent.patch(`/auth/users/${me.user.ID}`).send({ Enabled: false })).status).toBe(403);
        const after = await prisma.user.findUniqueOrThrow({ where: { ID: me.user.ID } });
        expect(after.UserType).toBe('USER');
        expect(after.FirstName).toBe('Test');

        const start = new Date('2026-01-05T08:00:00Z');
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ WorkStartTime: start })).status).toBe(200);
        expect((await prisma.user.findUniqueOrThrow({ where: { ID: me.user.ID } })).WorkStartTime).toEqual(start);
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ WorkStartTime: null })).status).toBe(200);
    });

    it("doesn't let users change someone else's timer", async () => {
        expect((await s.user.agent.patch(`/auth/users/${s.other.user.ID}`).send({ WorkStartTime: new Date() })).status).toBe(403);
    });

    it('lets admins change the allowed fields only', async () => {
        const target = s.user.user;
        const res = await s.admin.agent.patch(`/auth/users/${target.ID}`).send({ FirstName: 'Renamed', UserType: 'MANAGER', PasswordHash: 'x', Deleted: true });
        expect(res.status).toBe(200);
        const after = await prisma.user.findUniqueOrThrow({ where: { ID: target.ID } });
        expect(after.FirstName).toBe('Renamed');
        expect(after.UserType).toBe('MANAGER');
        expect(after.PasswordHash).not.toBe('x');
        expect(after.Deleted).toBe(false);
    });

    it('signs a disabled user out', async () => {
        expect((await s.user.agent.get('/auth/me')).status).toBe(200);
        expect((await s.admin.agent.patch(`/auth/users/${s.user.user.ID}`).send({ Enabled: false })).status).toBe(200);
        expect((await s.user.agent.get('/auth/me')).status).toBe(401);
    });

    it("doesn't let an admin lock themselves out", async () => {
        const me = s.admin;
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ UserType: 'USER' })).status).toBe(400);
        expect((await me.agent.patch(`/auth/users/${me.user.ID}`).send({ Enabled: false })).status).toBe(400);
    });
});

describe('work time', () => {
    it('is logged by the user for themselves only', async () => {
        const time = { WorkStartTime: '2026-01-05T08:00:00Z', WorkStopTime: '2026-01-05T16:00:00Z' };
        expect((await s.user.agent.post(`/auth/users/timer/${s.other.user.ID}`).send(time)).status).toBe(403);
        expect((await s.admin.agent.post(`/auth/users/timer/${s.other.user.ID}`).send(time)).status).toBe(403);
        expect((await s.user.agent.post(`/auth/users/timer/${s.user.user.ID}`).send(time)).status).toBe(200);
        const logged = await prisma.workTime.findMany();
        expect(logged).toHaveLength(1);
        expect(logged[0].UserID).toBe(s.user.user.ID);
    });

    it('rejects a stop time before the start', async () => {
        const time = { WorkStartTime: '2026-01-05T16:00:00Z', WorkStopTime: '2026-01-05T08:00:00Z' };
        expect((await s.user.agent.post(`/auth/users/timer/${s.user.user.ID}`).send(time)).status).toBe(400);
    });
});

describe('personal tasks', () => {
    const task = { Name: 'Call supplier', Description: '', FinishDate: '2026-02-01T10:00:00Z' };

    it('are private to their owner', async () => {
        const mine = `/auth/${s.user.user.ID}/personal-tasks`;
        expect((await s.user.agent.post(mine).send({ task })).status).toBe(200);
        expect((await s.other.agent.get(mine)).status).toBe(403);
        expect((await s.admin.agent.get(mine)).status).toBe(403);
        expect((await s.other.agent.post(mine).send({ task })).status).toBe(403);

        const list = await s.user.agent.get(mine);
        expect(list.body).toHaveLength(1);
        expect(list.body[0].FinishDate).toBe('2026-02-01T10:00:00.000Z');
        expect(list.body[0].UserID).toBe(s.user.user.ID);
    });

    it("can't be changed through someone else's URL", async () => {
        await s.user.agent.post(`/auth/${s.user.user.ID}/personal-tasks`).send({ task });
        const id = (await prisma.privateTask.findFirstOrThrow()).ID;
        // the other user uses their own user ID with the victim's task ID
        expect((await s.other.agent.patch(`/auth/${s.other.user.ID}/personal-tasks/${id}`).send({ task: { Finished: true } })).status).toBe(404);
        expect(
            (await s.user.agent.patch(`/auth/${s.user.user.ID}/personal-tasks/${id}`).send({ task: { Finished: true, UserID: s.other.user.ID } })).status,
        ).toBe(200);
        const after = await prisma.privateTask.findUniqueOrThrow({ where: { ID: id } });
        expect(after.Finished).toBe(true);
        expect(after.UserID).toBe(s.user.user.ID);
    });

    it('can be deleted one by one, only by their owner', async () => {
        await s.user.agent.post(`/auth/${s.user.user.ID}/personal-tasks`).send({ task });
        const id = (await prisma.privateTask.findFirstOrThrow()).ID;
        expect((await s.other.agent.delete(`/auth/${s.other.user.ID}/personal-tasks/${id}`)).status).toBe(404);
        expect((await s.other.agent.delete(`/auth/${s.user.user.ID}/personal-tasks/${id}`)).status).toBe(403);
        expect((await s.user.agent.delete(`/auth/${s.user.user.ID}/personal-tasks/${id}`)).status).toBe(200);
        expect(await prisma.privateTask.count()).toBe(0);
    });

    it("removing finished tasks only removes the user's own", async () => {
        for (const who of [s.user, s.other]) {
            await who.agent.post(`/auth/${who.user.ID}/personal-tasks`).send({ task });
        }
        await prisma.privateTask.updateMany({ data: { Finished: true } });
        const res = await s.user.agent.delete(`/auth/${s.user.user.ID}/personal-tasks`);
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(1);
        expect(await prisma.privateTask.count({ where: { UserID: s.other.user.ID } })).toBe(1);
    });
});
