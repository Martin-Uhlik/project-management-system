import { rm } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeApp, prisma, resetDb, signInAll } from './helpers.ts';

const app = makeApp();
let s: Awaited<ReturnType<typeof signInAll>>;

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
});

describe('machine responsible person', () => {
    it('is set by admins and managers, and can then edit the machine but not hand it over', async () => {
        const machine = await prisma.machine.create({ data: { Name: 'Laser' } });
        const url = `/auth/machines/${machine.ID}`;
        expect((await s.user.agent.patch(url).send({ ResponsibleID: s.user.user.ID })).status).toBe(403);
        expect((await s.manager.agent.patch(url).send({ ResponsibleID: s.user.user.ID })).status).toBe(200);

        const list = (await s.other.agent.get('/auth/machines')).body;
        expect(list[0]).toMatchObject({ Name: 'Laser', Responsible: { ID: s.user.user.ID }, LastService: null, NextService: null, OpenTasks: 0 });

        expect((await s.user.agent.patch(url).send({ Description: 'Fiber 6 kW' })).status).toBe(200);
        expect((await s.user.agent.patch(url).send({ ResponsibleID: s.other.user.ID })).status).toBe(403);
        expect((await s.other.agent.patch(url).send({ Description: 'x' })).status).toBe(403);
        expect((await s.other.agent.get(url)).body.Description).toBe('Fiber 6 kW');
    });
});

describe('machine services', () => {
    it('give the last done and the next planned service, and are changed by the people who edit the machine', async () => {
        const machine = await prisma.machine.create({ data: { Name: 'Press', ResponsibleID: s.user.user.ID } });
        const base = `/auth/machines/${machine.ID}/services`;
        expect((await s.other.agent.post(base).send({ Date: '2026-01-10', Title: 'x' })).status).toBe(403);
        expect((await s.user.agent.post(base).send({ Date: '2026-01-10', Title: 'Old check', Done: true })).status).toBe(200);
        expect((await s.user.agent.post(base).send({ Date: '2026-06-10', Title: 'Yearly check', Done: true })).status).toBe(200);
        expect((await s.manager.agent.post(base).send({ Date: '2027-06-10', Title: 'Next yearly' })).status).toBe(200);
        expect((await s.manager.agent.post(base).send({ Date: '2027-01-10', Title: 'Oil' })).status).toBe(200);
        expect((await s.manager.agent.post(base).send({ Date: '2027-01-10', Title: '' })).status).toBe(400);

        const detail = (await s.other.agent.get(`/auth/machines/${machine.ID}`)).body;
        expect(detail.Services).toHaveLength(4);
        expect(detail.LastService.Title).toBe('Yearly check');
        expect(detail.NextService.Title).toBe('Oil');

        const oil = detail.Services.find((service: { Title: string }) => service.Title === 'Oil');
        expect((await s.other.agent.patch(`${base}/${oil.ID}`).send({ Done: true })).status).toBe(403);
        expect((await s.user.agent.patch(`${base}/${oil.ID}`).send({ Done: true })).status).toBe(200);
        const list = (await s.other.agent.get('/auth/machines')).body;
        expect(list[0].LastService.Title).toBe('Oil');
        expect(list[0].NextService.Title).toBe('Next yearly');

        const other = await prisma.machine.create({ data: { Name: 'Other' } });
        expect((await s.admin.agent.delete(`/auth/machines/${other.ID}/services/${oil.ID}`)).status).toBe(404);
        expect((await s.admin.agent.delete(`${base}/${oil.ID}`)).status).toBe(200);
        expect((await s.other.agent.get(`/auth/machines/${machine.ID}`)).body.Services).toHaveLength(3);
    });
});

describe('machine files', () => {
    it('are read by everyone and uploaded and removed by the people who edit the machine', async () => {
        const machine = await prisma.machine.create({ data: { Name: 'Robot', ResponsibleID: s.user.user.ID } });
        // the database starts again from ID 1 in every test, the files folder doesn't
        await rm(path.join(process.env.DATA_DIR!, 'machines', String(machine.ID)), { recursive: true, force: true });
        const base = `/auth/machines/${machine.ID}/files`;
        expect((await s.other.agent.post(base).attach('file', Buffer.from('x'), 'x.pdf')).status).toBe(403);
        expect((await s.user.agent.post(base).attach('file', Buffer.from('manual'), '../manual.pdf')).status).toBe(200);

        const list = (await s.other.agent.get(base)).body;
        expect(list).toHaveLength(1);
        expect(list[0]).toMatchObject({ file: 'manual.pdf', Bytes: 6, UploadedBy: { ID: s.user.user.ID } });
        expect((await s.other.agent.get(`/auth/machines/${machine.ID}`)).body.FileCount).toBe(1);

        const download = await s.other.agent.get(`${base}/manual.pdf`);
        expect(download.status).toBe(200);
        expect(download.headers['content-disposition']).toContain('attachment');

        expect((await s.other.agent.delete(`${base}/manual.pdf`)).status).toBe(403);
        expect((await s.manager.agent.delete(`${base}/manual.pdf`)).status).toBe(200);
        expect((await s.manager.agent.delete(`${base}/manual.pdf`)).status).toBe(404);
        expect((await s.other.agent.get(base)).body).toEqual([]);
    });
});
