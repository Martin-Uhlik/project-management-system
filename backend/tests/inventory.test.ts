import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, createTask, makeApp, prisma, resetDb, signInAll } from './helpers.ts';

const app = makeApp();
let s: Awaited<ReturnType<typeof signInAll>>;

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
});

describe('material', () => {
    it('is added to stock by managers, recorded as theirs', async () => {
        const body = { Name: 'Screws', Count: 100, TargetUserID: s.user.user.ID };
        expect((await s.user.agent.post('/auth/material').send(body)).status).toBe(403);
        expect((await s.manager.agent.post('/auth/material').send(body)).status).toBe(200);
        expect((await s.manager.agent.post('/auth/material').send({ ...body, Count: -5 })).status).toBe(400);
        const [material] = (await s.user.agent.get('/auth/material')).body;
        expect(material.Name).toBe('Screws');
        expect(material.MaterialEvent).toMatchObject([{ Count: 100, EventType: 'ADD', TargetUserID: s.manager.user.ID }]);
    });

    it('is renamed by managers only', async () => {
        const material = await prisma.material.create({ data: { Name: 'Screws' } });
        expect((await s.user.agent.patch(`/auth/material/${material.ID}`).send({ Name: 'Nails' })).status).toBe(403);
        expect((await s.manager.agent.patch(`/auth/material/${material.ID}`).send({ Name: 'Nails' })).status).toBe(200);
        expect((await prisma.material.findUniqueOrThrow({ where: { ID: material.ID } })).Name).toBe('Nails');
    });

    it('stock movements are made by anyone, as themselves, for tasks they can open', async () => {
        const material = await prisma.material.create({ data: { Name: 'Screws' } });
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const url = `/auth/material/${material.ID}/event`;

        const res = await s.user.agent
            .post(url)
            .send({ Count: 5, EventType: 'RESERVATION', TargetTaskID: task.ID, TargetUserID: s.admin.user.ID, MaterialID: 9999 });
        expect(res.status).toBe(200);
        expect(await prisma.materialEvent.findFirstOrThrow()).toMatchObject({
            Count: 5,
            EventType: 'RESERVATION',
            TargetTaskID: task.ID,
            TargetUserID: s.user.user.ID,
            MaterialID: material.ID,
        });

        expect((await s.other.agent.post(url).send({ Count: 1, EventType: 'RESERVATION', TargetTaskID: task.ID })).status).toBe(403);
        expect((await s.user.agent.post(url).send({ Count: 1, EventType: 'STEAL' })).status).toBe(400);
        expect((await s.user.agent.post('/auth/material/9999/event').send({ Count: 1, EventType: 'ADD' })).status).toBe(404);

        const taskMaterial = await s.user.agent.get(`/auth/tasks/${task.ID}/material`);
        expect(taskMaterial.status).toBe(200);
        expect(taskMaterial.body[0].Material.Name).toBe('Screws');
        expect((await s.other.agent.get(`/auth/tasks/${task.ID}/material`)).status).toBe(403);
    });
});

describe('stock and reservations', () => {
    it('keeps the details of an item and counts stock, open reservations and what is available', async () => {
        const created = await s.manager.agent
            .post('/auth/material')
            .send({ Name: 'Pipe', Unit: 'm', Price: 120, Supplier: 'Ferona', Location: 'A3', MinCount: 5, Count: 10 });
        expect(created.status).toBe(200);
        const ID = created.body.ID;
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const move = (EventType: string, Count: number, TargetTaskID: number | null = task.ID) =>
            s.user.agent.post(`/auth/material/${ID}/event`).send({ EventType, Count, TargetTaskID });

        expect((await move('RESERVATION', 4)).status).toBe(200);
        // taking items out for the task uses its reservation up
        expect((await move('REMOVE', 3)).status).toBe(200);
        expect((await move('RELEASE', 2)).status).toBe(400);
        expect((await move('REMOVE', 50)).status).toBe(400);
        expect((await move('RESERVATION', 2, null)).status).toBe(200);

        const [item] = (await s.other.agent.get('/auth/material')).body;
        expect(item).toMatchObject({
            Name: 'Pipe',
            Unit: 'm',
            Price: 120,
            Supplier: 'Ferona',
            Location: 'A3',
            MinCount: 5,
            Count: 7,
            Reserved: 3,
            Available: 4,
        });

        const detail = (await s.other.agent.get(`/auth/material/${ID}`)).body;
        expect(detail.Events).toHaveLength(4);
        expect(detail.Events[0].CreatedAt).toBeTruthy();
        expect(detail.Reservations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ Task: expect.objectContaining({ ID: task.ID, Project: { Name: 'Project' } }), Reserved: 4, Taken: 3, Open: 1 }),
                expect.objectContaining({ Task: null, Open: 2 }),
            ]),
        );

        expect((await move('RELEASE', 1)).status).toBe(200);
        const reservations = (await s.other.agent.get('/auth/material/reservations')).body;
        expect(reservations).toHaveLength(1);
        expect(reservations[0]).toMatchObject({ Material: { ID, Name: 'Pipe' }, Task: null, Open: 2, ReservedBy: [{ ID: s.user.user.ID }] });

        const taskMaterial = (await s.user.agent.get(`/auth/tasks/${task.ID}/material`)).body;
        expect(taskMaterial).toMatchObject([{ Material: { ID }, Reserved: 0, Taken: 3 }]);

        expect((await s.user.agent.patch(`/auth/material/${ID}`).send({ Price: 1 })).status).toBe(403);
        expect((await s.manager.agent.patch(`/auth/material/${ID}`).send({ Price: 130, Location: null })).status).toBe(200);
        expect(await prisma.material.findUniqueOrThrow({ where: { ID } })).toMatchObject({ Name: 'Pipe', Price: 130, Location: null });
        expect((await s.user.agent.get('/auth/material/9999')).status).toBe(404);
    });

    it('stocks an approved request: to its item or a new one, reserved for its task', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const existing = await prisma.material.create({ data: { Name: 'Bolt' } });
        const request = (data: object) =>
            prisma.materialRequest.create({ data: { Name: 'Glass', Count: 4, Price: 900, AddedDate: new Date(), TargetUserID: s.user.user.ID, ...data } });
        const stock = (ID: number, who = s.manager) => who.agent.post(`/auth/materialRequirements/${ID}/stock`);

        const waiting = await request({});
        expect((await stock(waiting.ID)).status).toBe(400);
        const forTask = await request({ AcceptedByID: s.manager.user.ID, TargetTaskID: task.ID });
        expect((await stock(forTask.ID, s.user)).status).toBe(403);
        const res = await stock(forTask.ID);
        expect(res.status).toBe(200);
        const glass = (await s.user.agent.get(`/auth/material/${res.body.MaterialID}`)).body;
        expect(glass).toMatchObject({ Name: 'Glass', Price: 900, Count: 4, Reserved: 4, Available: 0 });
        expect(await prisma.materialRequest.findUnique({ where: { ID: forTask.ID } })).toBeNull();

        const restock = await request({ AcceptedByID: s.manager.user.ID, MaterialID: existing.ID });
        expect((await stock(restock.ID)).body.MaterialID).toBe(existing.ID);
        expect((await s.user.agent.get(`/auth/material/${existing.ID}`)).body).toMatchObject({ Count: 4, Reserved: 0 });
    });
});

describe('material requirements', () => {
    const body = { Name: 'Glue', Description: 'strong', Count: 2, Price: 150, NeededDate: '2026-03-01T00:00:00Z' };

    it('are created by managers, recorded as theirs', async () => {
        expect((await s.user.agent.post('/auth/materialRequirements').send(body)).status).toBe(403);
        const res = await s.manager.agent.post('/auth/materialRequirements').send({ ...body, TargetUserID: s.user.user.ID, AcceptedByID: s.admin.user.ID });
        expect(res.status).toBe(200);
        expect(await prisma.materialRequest.findFirstOrThrow()).toMatchObject({ Name: 'Glue', TargetUserID: s.manager.user.ID, AcceptedByID: null });
    });

    it('are listed without password hashes', async () => {
        await s.manager.agent.post('/auth/materialRequirements').send(body);
        const res = await s.user.agent.get('/auth/materialRequirements');
        expect(res.status).toBe(200);
        expect(res.body[0].TargetUser.ID).toBe(s.manager.user.ID);
        expect(JSON.stringify(res.body)).not.toContain('PasswordHash');
    });

    it('are accepted by managers only, as themselves', async () => {
        await s.manager.agent.post('/auth/materialRequirements').send(body);
        const { ID } = await prisma.materialRequest.findFirstOrThrow();
        expect((await s.user.agent.patch(`/auth/materialRequirements/${ID}`).send({ Accepted: true })).status).toBe(403);
        expect((await s.admin.agent.patch(`/auth/materialRequirements/${ID}`).send({ Accepted: true, AcceptedByID: s.user.user.ID })).status).toBe(200);
        const after = await prisma.materialRequest.findUniqueOrThrow({ where: { ID } });
        expect(after.AcceptedByID).toBe(s.admin.user.ID);
        expect(after.AcceptedDate).not.toBeNull();
    });

    it('are edited and removed by managers or their creator', async () => {
        const mine = await prisma.materialRequest.create({ data: { ...body, AddedDate: new Date(), TargetUserID: s.user.user.ID } });
        expect((await s.other.agent.patch(`/auth/materialRequirements/${mine.ID}`).send({ Count: 3 })).status).toBe(403);
        expect((await s.user.agent.patch(`/auth/materialRequirements/${mine.ID}`).send({ Count: 3, TargetUserID: s.other.user.ID })).status).toBe(200);
        expect(await prisma.materialRequest.findUniqueOrThrow({ where: { ID: mine.ID } })).toMatchObject({ Count: 3, TargetUserID: s.user.user.ID });
        expect((await s.other.agent.delete(`/auth/materialRequirements/${mine.ID}`)).status).toBe(403);
        expect((await s.manager.agent.delete(`/auth/materialRequirements/${mine.ID}`)).status).toBe(200);
        expect((await s.manager.agent.delete(`/auth/materialRequirements/${mine.ID}`)).status).toBe(404);
    });
});

describe('machines', () => {
    it('are added and removed by admins, edited by managers', async () => {
        expect((await s.manager.agent.post('/auth/machines').send({ Name: 'CNC' })).status).toBe(403);
        expect((await s.admin.agent.post('/auth/machines').send({ Name: 'CNC', Deleted: true })).status).toBe(200);
        const [machine] = (await s.user.agent.get('/auth/machines')).body;
        expect(machine.Name).toBe('CNC');

        expect((await s.user.agent.patch(`/auth/machines/${machine.ID}`).send({ Description: 'x' })).status).toBe(403);
        expect((await s.manager.agent.patch(`/auth/machines/${machine.ID}`).send({ Description: 'Big one' })).status).toBe(200);
        expect((await s.user.agent.get(`/auth/machines/${machine.ID}`)).body.Description).toBe('Big one');

        expect((await s.manager.agent.delete(`/auth/machines/${machine.ID}`)).status).toBe(403);
        expect((await s.admin.agent.delete(`/auth/machines/${machine.ID}`)).status).toBe(200);
        expect((await s.user.agent.get('/auth/machines')).body).toHaveLength(0);
        expect((await s.user.agent.get(`/auth/machines/${machine.ID}`)).status).toBe(404);
    });

    it('are assigned to tasks by managers', async () => {
        const machine = await prisma.machine.create({ data: { Name: 'Saw' } });
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        const url = `/auth/projects/${project.ID}/tasks/${task.ID}`;
        expect((await s.user.agent.patch(url).send({ MachineID: machine.ID })).status).toBe(403);
        expect((await s.manager.agent.patch(url).send({ MachineID: machine.ID })).status).toBe(200);
        expect((await s.manager.agent.patch(url).send({ MachineID: 9999 })).status).toBe(400);
        expect((await s.user.agent.get(`/auth/machines/${machine.ID}`)).body.Task).toHaveLength(1);
    });
});

describe('unknown addresses', () => {
    it('answer 404', async () => {
        expect((await s.user.agent.get('/auth/nothing/here/at/all')).status).toBe(404);
    });
});
