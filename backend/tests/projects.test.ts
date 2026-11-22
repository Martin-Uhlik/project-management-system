import { rm } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, createTask, makeApp, prisma, resetDb, signInAll } from './helpers.ts';

const app = makeApp();
let s: Awaited<ReturnType<typeof signInAll>>;

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
});

describe('projects', () => {
    it('are created by admins and managers only, with allowed fields', async () => {
        const body = {
            Name: 'Kitchen',
            Description: 'd',
            Customer: 'c',
            FinishDate: '2026-06-01T00:00:00Z',
            OwnerID: s.manager.user.ID,
            Deleted: true,
            ID: 999,
        };
        expect((await s.user.agent.post('/auth/projects').send(body)).status).toBe(403);
        expect((await s.manager.agent.post('/auth/projects').send(body)).status).toBe(200);
        const project = await prisma.project.findFirstOrThrow();
        expect(project.Name).toBe('Kitchen');
        expect(project.Deleted).toBe(false);
        expect(project.ID).not.toBe(999);
        expect(project.Finished).toBe(false);
    });

    it('are updated by their owner and admins only, including members', async () => {
        const project = await createProject(s.manager.user.ID);
        // a manager who doesn't own it may not
        const otherProject = await createProject(s.admin.user.ID);
        expect((await s.manager.agent.patch(`/auth/projects/${otherProject.ID}`).send({ Name: 'x' })).status).toBe(403);
        expect((await s.admin.agent.patch(`/auth/projects/${otherProject.ID}`).send({ Name: 'Admin' })).status).toBe(200);
        // a worker who owns one may
        const ownProject = await createProject(s.user.user.ID);
        expect((await s.user.agent.patch(`/auth/projects/${ownProject.ID}`).send({ Name: 'Mine' })).status).toBe(200);

        const update = { Name: 'Renamed', Finished: true, Members: [{ UserID: s.user.user.ID }, { UserID: s.user.user.ID }] };
        expect((await s.user.agent.patch(`/auth/projects/${project.ID}`).send(update)).status).toBe(403);
        expect((await s.manager.agent.patch(`/auth/projects/${project.ID}`).send(update)).status).toBe(200);
        const after = await prisma.project.findUniqueOrThrow({ where: { ID: project.ID }, include: { Member: true } });
        expect(after.Name).toBe('Renamed');
        expect(after.Finished).toBe(true);
        expect(after.Member.map((member) => member.UserID)).toEqual([s.user.user.ID]);

        // a partial update leaves the members alone
        expect((await s.manager.agent.patch(`/auth/projects/${project.ID}`).send({ Customer: 'ACME' })).status).toBe(200);
        expect(await prisma.user_Project.count()).toBe(1);
    });

    it('are deleted by their owner and admins only', async () => {
        const owned = await createProject(s.manager.user.ID, [s.user.user.ID]);
        expect((await s.user.agent.delete(`/auth/projects/${owned.ID}`)).status).toBe(403);
        expect((await s.manager.agent.delete(`/auth/projects/${owned.ID}`)).status).toBe(200);

        const project = await createProject(s.user.user.ID);
        expect((await s.manager.agent.delete(`/auth/projects/${project.ID}`)).status).toBe(403);
        expect((await s.admin.agent.delete(`/auth/projects/${project.ID}`)).status).toBe(200);
        expect((await prisma.project.findUniqueOrThrow({ where: { ID: project.ID } })).Deleted).toBe(true);
        expect((await s.admin.agent.get('/auth/projects')).body).toHaveLength(0);
        expect((await s.admin.agent.get(`/auth/projects/${project.ID}`)).status).toBe(404);
    });

    it('say in the list whether the signed-in user owns or is a member of each (Mine)', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const mine = async (who: typeof s.user) => (await who.agent.get('/auth/projects')).body.find((p: { ID: number }) => p.ID === project.ID).Mine;
        expect(await mine(s.manager)).toBe(true);
        expect(await mine(s.user)).toBe(true);
        expect(await mine(s.admin)).toBe(false);
    });

    it('send their members without password hashes', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const res = await s.user.agent.get(`/auth/projects/${project.ID}`);
        expect(res.status).toBe(200);
        expect(res.body.Member[0].User.ID).toBe(s.user.user.ID);
        expect(JSON.stringify(res.body)).not.toContain('PasswordHash');
    });

    it('answer 404 when missing', async () => {
        expect((await s.admin.agent.patch('/auth/projects/9999').send({ Name: 'x' })).status).toBe(404);
        expect((await s.admin.agent.delete('/auth/projects/9999')).status).toBe(404);
    });
});

describe('project tasks', () => {
    const newTask = { Name: 'Cut boards', Description: null, FinishDate: '2026-06-01T00:00:00Z', XPosition: 1.5, YPosition: -2, Size: 10, Finished: true };

    it('are opened by admins, managers, the owner and members only', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        await createTask(project.ID, s.manager.user.ID);
        for (const who of [s.admin, s.manager, s.user]) {
            const res = await who.agent.get(`/auth/projects/${project.ID}/tasks`);
            expect(res.status).toBe(200);
            expect(res.body.tasks).toHaveLength(1);
        }
        expect((await s.other.agent.get(`/auth/projects/${project.ID}/tasks`)).status).toBe(403);
    });

    it('are created by admins and managers, in the project from the URL', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const elsewhere = await createProject(s.manager.user.ID);
        const body = { ...newTask, OwnerID: s.manager.user.ID, ProjectID: elsewhere.ID };
        expect((await s.user.agent.post(`/auth/projects/${project.ID}/tasks`).send(body)).status).toBe(403);
        expect((await s.manager.agent.post(`/auth/projects/${project.ID}/tasks`).send(body)).status).toBe(200);
        const task = await prisma.task.findFirstOrThrow();
        expect(task.ProjectID).toBe(project.ID);
        expect(task.Finished).toBe(false);
        expect((await s.manager.agent.post(`/auth/projects/${project.ID}/tasks`).send({ ...body, Size: 'big' })).status).toBe(400);
        expect((await s.manager.agent.post(`/auth/projects/9999/tasks`).send(body)).status).toBe(404);
    });

    it('can be finished by assigned users, but only managers change the details', async () => {
        const project = await createProject(s.manager.user.ID);
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        const url = `/auth/projects/${project.ID}/tasks/${task.ID}`;

        // assigned (not a project member): can open the task and finish it
        expect((await s.user.agent.get(url)).status).toBe(200);
        expect((await s.user.agent.patch(url).send({ Finished: true })).status).toBe(200);
        expect((await s.user.agent.patch(url).send({ Name: 'Mine now' })).status).toBe(403);
        expect((await s.user.agent.patch(url).send({ Finished: false, OwnerID: s.user.user.ID })).status).toBe(403);
        expect((await s.user.agent.patch(url).send({ MachineID: null })).status).toBe(403);
        // not assigned
        expect((await s.other.agent.get(url)).status).toBe(403);
        expect((await s.other.agent.patch(url).send({ Finished: false })).status).toBe(403);

        const update = { Name: 'Renamed', DurationHours: 3, DurationMinutes: 30, Members: [{ UserID: s.other.user.ID }], ProjectID: 9999 };
        expect((await s.manager.agent.patch(url).send(update)).status).toBe(200);
        const after = await prisma.task.findUniqueOrThrow({ where: { ID: task.ID }, include: { User_Task: true } });
        expect(after).toMatchObject({ Name: 'Renamed', Finished: true, DurationHours: 3, DurationMinutes: 30, ProjectID: project.ID });
        expect(after.User_Task.map((member) => member.UserID)).toEqual([s.other.user.ID]);
    });

    it('can be moved in the graph by project members', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const url = `/auth/projects/${project.ID}/tasks/${task.ID}`;
        expect((await s.user.agent.patch(url).send({ XPosition: 5, YPosition: 6 })).status).toBe(200);
        expect((await s.user.agent.patch(url).send({ Finished: true })).status).toBe(403);
        expect((await s.other.agent.patch(url).send({ XPosition: 1, YPosition: 1 })).status).toBe(403);
        expect(await prisma.task.findUniqueOrThrow({ where: { ID: task.ID } })).toMatchObject({ XPosition: 5, YPosition: 6, Finished: false });
    });

    it("must belong to the URL's project", async () => {
        const mine = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const theirs = await createProject(s.manager.user.ID);
        const task = await createTask(theirs.ID, s.manager.user.ID);
        expect((await s.user.agent.get(`/auth/projects/${mine.ID}/tasks/${task.ID}`)).status).toBe(404);
        expect((await s.user.agent.patch(`/auth/projects/${mine.ID}/tasks/${task.ID}`).send({ XPosition: 1 })).status).toBe(404);
    });

    it('are deleted by managers, with their links', async () => {
        const project = await createProject(s.manager.user.ID);
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        const next = await createTask(project.ID, s.manager.user.ID);
        await prisma.taskDependency.create({ data: { ProjectID: project.ID, PredecessorID: task.ID, SuccessorID: next.ID } });
        const material = await prisma.material.create({ data: { Name: 'Screws' } });
        await prisma.materialEvent.create({ data: { Count: 1, EventType: 'RESERVATION', MaterialID: material.ID, TargetTaskID: task.ID } });
        const url = `/auth/projects/${project.ID}/tasks/${task.ID}`;

        expect((await s.user.agent.delete(url)).status).toBe(403);
        expect((await s.manager.agent.delete(url)).status).toBe(200);
        expect(await prisma.task.count()).toBe(1);
        expect(await prisma.taskDependency.count()).toBe(0);
        expect((await prisma.materialEvent.findFirstOrThrow()).TargetTaskID).toBeNull();
    });
});

describe('task dependencies', () => {
    it('are managed by managers, within one project', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const a = await createTask(project.ID, s.manager.user.ID);
        const b = await createTask(project.ID, s.manager.user.ID);
        const other = await createTask((await createProject(s.manager.user.ID)).ID, s.manager.user.ID);
        const base = `/auth/projects/${project.ID}/tasks/${b.ID}`;

        expect((await s.user.agent.post(`${base}/predecessor`).send({ id: a.ID })).status).toBe(403);
        expect((await s.manager.agent.post(`${base}/predecessor`).send({ id: other.ID })).status).toBe(404);
        expect((await s.manager.agent.post(`${base}/predecessor`).send({ id: b.ID })).status).toBe(400);
        expect((await s.manager.agent.post(`${base}/predecessor`).send({ id: a.ID })).status).toBe(200);
        expect(await prisma.taskDependency.findFirstOrThrow()).toMatchObject({ PredecessorID: a.ID, SuccessorID: b.ID, ProjectID: project.ID });

        const graph = await s.user.agent.get(`/auth/projects/${project.ID}/tasks`);
        expect(graph.body.dependencies).toHaveLength(1);

        expect((await s.manager.agent.delete(`${base}/predecessor`).send({ id: a.ID })).status).toBe(200);
        expect(await prisma.taskDependency.count()).toBe(0);

        expect((await s.manager.agent.post(`/auth/projects/${project.ID}/tasks/${a.ID}/successor`).send({ id: b.ID })).status).toBe(200);
        expect((await s.manager.agent.delete(`/auth/projects/${project.ID}/tasks/${a.ID}/successor`).send({ id: b.ID })).status).toBe(200);
        expect(await prisma.taskDependency.count()).toBe(0);
    });
});

describe('task files', () => {
    it('are listed and uploaded by people who can open the task', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const base = `/auth/projects/${project.ID}/tasks/${task.ID}`;

        const upload = await s.user.agent.post(`${base}/input-files`).attach('file', Buffer.from('hello'), '../../escape.txt');
        expect(upload.status).toBe(200);
        const list = await s.user.agent.get(`${base}/input-files`);
        expect(list.status).toBe(200);
        expect(list.body.map((file: { file: string }) => file.file)).toEqual(['escape.txt']);
        expect((await s.user.agent.get(`${base}/output-files`)).body).toEqual([]);

        expect((await s.other.agent.get(`${base}/input-files`)).status).toBe(403);
        expect((await s.other.agent.post(`${base}/output-files`).attach('file', Buffer.from('x'), 'x.txt')).status).toBe(403);
        expect((await s.user.agent.post(`${base}/output-files`)).status).toBe(400);
    });

    it('are listed for the whole project with their kind and task, and counted on the task', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        // the database starts again from ID 1 in every test, the files folder doesn't: drop files left by earlier tests
        await rm(path.join(process.env.DATA_DIR!, String(project.ID)), { recursive: true, force: true });
        const base = `/auth/projects/${project.ID}/tasks/${task.ID}`;
        expect((await s.user.agent.post(`${base}/input-files`).attach('file', Buffer.from('a'), 'in.txt')).status).toBe(200);
        expect((await s.user.agent.post(`${base}/output-files`).attach('file', Buffer.from('b'), 'out.txt')).status).toBe(200);

        const files = await s.user.agent.get(`/auth/projects/${project.ID}/files`);
        expect(files.status).toBe(200);
        expect(files.body.map((file: { file: string; Kind: string; Task: { ID: number } }) => [file.file, file.Kind, file.Task.ID]).sort()).toEqual([
            ['in.txt', 'input', task.ID],
            ['out.txt', 'output', task.ID],
        ]);
        expect((await s.other.agent.get(`/auth/projects/${project.ID}/files`)).status).toBe(403);

        const detail = await s.user.agent.get(base);
        expect(detail.body.Counts).toEqual({ InputFiles: 1, OutputFiles: 1, Machines: 0, Material: 0 });
    });

    it('record who uploaded them and can be downloaded, only as a download', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID);
        const base = `/auth/projects/${project.ID}/tasks/${task.ID}`;

        expect((await s.user.agent.post(`${base}/output-files`).attach('file', Buffer.from('<svg/>'), 'drawing.svg')).status).toBe(200);
        const list = await s.manager.agent.get(`${base}/output-files`);
        const drawing = list.body.find((file: { file: string }) => file.file === 'drawing.svg');
        expect(drawing).toMatchObject({ Bytes: 6, UploadedBy: { ID: s.user.user.ID } });
        expect(drawing.UploadedBy.PasswordHash).toBeUndefined();

        const download = await s.manager.agent.get(`${base}/output-files/drawing.svg`);
        expect(download.status).toBe(200);
        expect(download.headers['content-disposition']).toMatch(/^attachment/);
        expect(download.headers['x-content-type-options']).toBe('nosniff');
        expect(download.headers['content-security-policy']).toContain('sandbox');

        expect((await s.manager.agent.get(`${base}/output-files/missing.txt`)).status).toBe(404);
        expect((await s.manager.agent.get(`${base}/output-files/..%2F..%2Fsecret`)).status).toBe(400);
        expect((await s.other.agent.get(`${base}/output-files/drawing.svg`)).status).toBe(403);

        // the task can still be removed with its file records
        expect((await s.manager.agent.delete(`${base}`)).status).toBe(200);
    });
});

describe('assigned tasks', () => {
    it("list a user's tasks, without deleted projects", async () => {
        const project = await createProject(s.manager.user.ID);
        await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        const gone = await createProject(s.manager.user.ID);
        await createTask(gone.ID, s.manager.user.ID, [s.user.user.ID]);
        await prisma.project.update({ where: { ID: gone.ID }, data: { Deleted: true } });

        const res = await s.user.agent.get(`/auth/${s.user.user.ID}/tasks`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].Task.Project.Name).toBe('Project');
    });
});

describe('project statistics', () => {
    it('compare planned and logged time per worker, for those who may open the project', async () => {
        const project = await createProject(s.manager.user.ID);
        const shared = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID, s.manager.user.ID]);
        await prisma.task.update({ where: { ID: shared.ID }, data: { DurationHours: 4 } });
        const start = new Date('2026-01-01T08:00:00Z');
        await prisma.userTaskTime.create({
            data: { UserID: s.user.user.ID, TaskID: shared.ID, StartTime: start, StopTime: new Date(start.getTime() + 90 * 60000) },
        });

        expect((await s.user.agent.get(`/auth/projects/${project.ID}/stats`)).status).toBe(403);
        const res = await s.manager.agent.get(`/auth/projects/${project.ID}/stats`);
        expect(res.status).toBe(200);
        expect(res.body.PlannedMinutes).toBe(240);
        expect(res.body.ActualMinutes).toBe(90);
        const byUser = Object.fromEntries(res.body.Workers.map((worker: { User: { ID: number } }) => [worker.User.ID, worker]));
        expect(byUser[s.user.user.ID]).toMatchObject({ PlannedMinutes: 120, ActualMinutes: 90, TaskCount: 1 });
        expect(byUser[s.manager.user.ID]).toMatchObject({ PlannedMinutes: 120, ActualMinutes: 0 });
        expect(byUser[s.user.user.ID].User.PasswordHash).toBeUndefined();
        expect(res.body.Tasks).toHaveLength(1);
        expect(res.body.Tasks[0].Workers).toHaveLength(2);
    });
});
