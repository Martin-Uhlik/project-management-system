import { rm } from 'node:fs/promises';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, seedDemoData } from '../src/demoData.ts';
import { makeApp, ORIGIN, prisma, resetDb } from './helpers.ts';

// the example data of seed.ts (SEED_DEMO_DATA=true): it must load into an empty database and look right in the app
const app = makeApp();
const signIn = async (UserName: string) => {
    const agent = request.agent(app);
    expect((await agent.post('/login').set('Origin', ORIGIN).send({ name: UserName, password: DEMO_PASSWORD })).status).toBe(200);
    return agent;
};

beforeAll(async () => {
    await resetDb();
    await rm(process.env.DATA_DIR!, { recursive: true, force: true });
    await seedDemoData();
}, 60000);

describe('demo data', () => {
    it('fills every part of the app', async () => {
        expect(await prisma.user.count()).toBe(15);
        expect(await prisma.project.count()).toBe(8);
        expect(await prisma.machine.count()).toBe(7);
        expect(await prisma.task.count()).toBeGreaterThan(40);
        expect(await prisma.chatMessage.count()).toBeGreaterThan(40);
        expect(await prisma.taskFile.count()).toBeGreaterThan(80);
        expect(await prisma.machineFile.count()).toBe(28);
        const jan = await prisma.user.findUniqueOrThrow({ where: { UserName: 'jnovak' } });
        expect(await prisma.user.count({ where: { ManagerID: jan.ID } })).toBe(7);
    });

    it('logs time only in the past and only on days someone was at work', async () => {
        const now = new Date();
        expect(await prisma.workTime.count({ where: { OR: [{ StartTime: { gt: now } }, { StopTime: { gt: now } }] } })).toBe(0);
        expect(await prisma.userTaskTime.count({ where: { StopTime: { gt: now } } })).toBe(0);
        const sessions = await prisma.userTaskTime.findMany({ select: { UserID: true, StartTime: true, StopTime: true } });
        expect(sessions.length).toBeGreaterThan(100);
        for (const session of sessions) {
            const attendance = await prisma.workTime.count({
                where: { UserID: session.UserID, StartTime: { lte: session.StartTime }, StopTime: { gte: session.StopTime! } },
            });
            expect(attendance).toBe(1);
        }
    });

    it('lists the example files of tasks and machines, and they download', async () => {
        const agent = await signIn('pdvorakova');
        const task = await prisma.task.findFirstOrThrow({ where: { Name: 'Návrh a statika' } });
        const base = `/auth/projects/${task.ProjectID}/tasks/${task.ID}`;
        const inputs = await agent.get(`${base}/input-files`);
        const outputs = await agent.get(`${base}/output-files`);
        expect(inputs.body.map((file: { file: string }) => file.file)).toEqual(['Zadání zákazníka.pdf']);
        expect(outputs.body.map((file: { file: string }) => file.file).sort()).toEqual([
            'Model konstrukce.stl',
            'Statický výpočet.pdf',
            expect.stringMatching(/^Výkres .+\.svg$/),
        ]);
        const pdf = await agent.get(`${base}/output-files/${encodeURIComponent('Statický výpočet.pdf')}`).buffer(true);
        expect(pdf.status).toBe(200);
        expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');

        const machine = await prisma.machine.findFirstOrThrow({ where: { Name: 'Laser Trumpf' } });
        const files = await agent.get(`/auth/machines/${machine.ID}/files`);
        expect(files.body).toHaveLength(4);
    });

    it('leaves Jan Novák a few unread messages', async () => {
        const chat = await (await signIn('jnovak')).get('/auth/chat');
        expect(chat.body.Unread).toBe(6);
        const tomas = await (await signIn('tsvoboda')).get('/auth/chat');
        expect(tomas.body.Unread).toBe(0);
    });
});
