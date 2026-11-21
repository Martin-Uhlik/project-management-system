import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, createTask, makeApp, PASSWORD, resetDb, signInAll } from './helpers.ts';

// the public demo (DEMO_MODE=true, UPLOAD_LIMIT_MB): visitors share the seeded accounts
const app = makeApp({ demoMode: true, uploadLimitMb: 1 });
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

    it('refuses uploads over UPLOAD_LIMIT_MB', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const base = `/auth/projects/${project.ID}/tasks/${task.ID}`;

        expect((await s.user.agent.post(`${base}/input-files`).attach('file', Buffer.alloc(1024), 'small.txt')).status).toBe(200);
        expect((await s.user.agent.post(`${base}/input-files`).attach('file', Buffer.alloc(2 * 1024 * 1024), 'big.bin')).status).toBe(413);
    });
});
