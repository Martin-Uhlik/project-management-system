import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, createTask, loginAs, makeApp, PASSWORD, prisma, resetDb, signInAll } from './helpers.ts';

// the public demo (DEMO_MODE=true): visitors share the seeded accounts
const app = makeApp({ demoMode: true });
let s: Awaited<ReturnType<typeof signInAll>>;

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
});

describe('demo mode', () => {
    it("doesn't let visitors change a password, so a shared account stays usable", async () => {
        for (const who of [s.user, s.manager]) {
            const res = await who.agent.patch(`/auth/users/password/${who.user.ID}`).send({ oldPassword: PASSWORD, newPassword: 'a new password' });
            expect(res.status).toBe(403);
        }
        expect(
            (await s.admin.agent.patch(`/auth/users/password/${s.admin.user.ID}`).send({ oldPassword: PASSWORD, newPassword: 'a new password' })).status,
        ).toBe(200);
    });

    it("doesn't let anyone upload files, and tells the frontend it is the demo", async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const machine = await prisma.machine.create({ data: { Name: 'Laser' } });
        const base = `/auth/projects/${project.ID}/tasks/${task.ID}`;
        for (const url of [`${base}/input-files`, `${base}/output-files`, `/auth/machines/${machine.ID}/files`]) {
            expect((await s.admin.agent.post(url).attach('file', Buffer.alloc(16), 'small.txt')).status).toBe(403);
        }
        expect((await s.manager.agent.get(`${base}/input-files`)).body).toEqual([]);
        expect((await s.user.agent.get('/auth/me')).body).toMatchObject({ ID: s.user.user.ID, Demo: true });
    });
});

describe('outside the demo', () => {
    it('refuses uploads over UPLOAD_LIMIT_MB', async () => {
        const limited = makeApp({ uploadLimitMb: 1 });
        const manager = await loginAs(limited, s.manager.user);
        const project = await createProject(s.manager.user.ID, []);
        const task = await createTask(project.ID, s.manager.user.ID);
        const base = `/auth/projects/${project.ID}/tasks/${task.ID}`;

        expect((await manager.get('/auth/me')).body.Demo).toBe(false);
        expect((await manager.post(`${base}/input-files`).attach('file', Buffer.alloc(1024), 'small.txt')).status).toBe(200);
        expect((await manager.post(`${base}/input-files`).attach('file', Buffer.alloc(2 * 1024 * 1024), 'big.bin')).status).toBe(413);
    });
});
