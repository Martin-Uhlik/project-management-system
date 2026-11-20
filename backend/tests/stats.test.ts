import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, createTask, makeApp, prisma, resetDb, signInAll } from './helpers.ts';

const app = makeApp();
let s: Awaited<ReturnType<typeof signInAll>>;

// November 2026 (UTC), as the browser sends it
const period = { from: '2026-11-01T00:00:00.000Z', to: '2026-12-01T00:00:00.000Z' };
const at = (day: number, hour: number) => new Date(Date.UTC(2026, 10, day, hour));

beforeEach(async () => {
    await resetDb();
    s = await signInAll(app);
    // the manager leads the user; "other" has no manager
    await prisma.user.update({ where: { ID: s.user.user.ID }, data: { ManagerID: s.manager.user.ID } });
});

describe('who sees whose statistics', () => {
    it('shows yourself, your people to a manager and everyone to an admin', async () => {
        const ids = async (agent: (typeof s)['user']['agent']) =>
            (await agent.get('/auth/stats/people').query(period)).body.map((person: { User: { ID: number } }) => person.User.ID);
        expect(await ids(s.user.agent)).toEqual([s.user.user.ID]);
        expect(await ids(s.manager.agent)).toEqual([s.manager.user.ID, s.user.user.ID]);
        expect(new Set(await ids(s.admin.agent))).toEqual(new Set([s.admin.user.ID, s.manager.user.ID, s.user.user.ID, s.other.user.ID]));
    });

    it('includes people under your people (all levels)', async () => {
        await prisma.user.update({ where: { ID: s.other.user.ID }, data: { ManagerID: s.user.user.ID } });
        const res = await s.manager.agent.get('/auth/stats/people').query(period);
        expect(res.body.map((person: { User: { ID: number } }) => person.User.ID)).toEqual(
            expect.arrayContaining([s.manager.user.ID, s.user.user.ID, s.other.user.ID]),
        );
    });

    it("refuses someone else's details", async () => {
        expect((await s.user.agent.get(`/auth/stats/users/${s.user.user.ID}`).query(period)).status).toBe(200);
        expect((await s.user.agent.get(`/auth/stats/users/${s.other.user.ID}`).query(period)).status).toBe(403);
        expect((await s.manager.agent.get(`/auth/stats/users/${s.user.user.ID}`).query(period)).status).toBe(200);
        expect((await s.manager.agent.get(`/auth/stats/users/${s.other.user.ID}`).query(period)).status).toBe(403);
        expect((await s.admin.agent.get(`/auth/stats/users/${s.other.user.ID}`).query(period)).status).toBe(200);
    });

    it("hides other people's work time and tasks in the user details", async () => {
        const res = await s.other.agent.get(`/auth/users/${s.user.user.ID}`);
        expect(res.status).toBe(200);
        expect(res.body.WorkTime).toBeUndefined();
        expect(res.body.User_Task).toBeUndefined();
        expect((await s.manager.agent.get(`/auth/users/${s.user.user.ID}`)).body.WorkTime).toEqual([]);
    });

    it('needs a valid period', async () => {
        expect((await s.user.agent.get('/auth/stats/people')).status).toBe(400);
        expect((await s.user.agent.get('/auth/stats/people').query({ from: period.to, to: period.from })).status).toBe(400);
        expect((await s.user.agent.get('/auth/stats/people').query({ from: '2026-01-01', to: '2026-12-01' })).status).toBe(400);
    });
});

describe('the numbers', () => {
    it("counts the month's work time and tasks, with the user's share of the plan", async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID, s.other.user.ID]);
        // 4 h planned, two workers: 2 h each
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID, s.other.user.ID]);
        await prisma.task.update({ where: { ID: task.ID }, data: { DurationHours: 4 } });
        await prisma.workTime.createMany({
            data: [
                { UserID: s.user.user.ID, StartTime: at(3, 8), StopTime: at(3, 11) }, // 3 h
                { UserID: s.user.user.ID, StartTime: new Date(Date.UTC(2026, 9, 31, 23)), StopTime: at(1, 1) }, // 1 h of it in November
                { UserID: s.user.user.ID, StartTime: new Date(Date.UTC(2026, 9, 10, 8)), StopTime: new Date(Date.UTC(2026, 9, 10, 9)) }, // October
            ],
        });
        await prisma.userTaskTime.createMany({
            data: [
                { UserID: s.user.user.ID, TaskID: task.ID, StartTime: at(3, 8), StopTime: at(3, 10) }, // 2 h in November
                { UserID: s.user.user.ID, TaskID: task.ID, StartTime: new Date(Date.UTC(2026, 9, 10, 8)), StopTime: new Date(Date.UTC(2026, 9, 10, 9)) }, // 1 h before
                { UserID: s.other.user.ID, TaskID: task.ID, StartTime: at(4, 8), StopTime: at(4, 18) }, // someone else's
            ],
        });

        const res = await s.manager.agent.get(`/auth/stats/users/${s.user.user.ID}`).query(period);
        expect(res.status).toBe(200);
        expect(res.body.WorkedMinutes).toBe(240);
        expect(res.body.WorkTime).toHaveLength(2);
        expect(res.body.Tasks).toHaveLength(1);
        expect(res.body.Tasks[0]).toMatchObject({ ID: task.ID, PlannedMinutes: 120, PeriodMinutes: 120, TotalMinutes: 180, Project: { ID: project.ID } });
        expect(JSON.stringify(res.body)).not.toContain('PasswordHash');

        const people = await s.manager.agent.get('/auth/stats/people').query(period);
        const user = people.body.find((person: { User: { ID: number } }) => person.User.ID === s.user.user.ID);
        expect(user).toMatchObject({ WorkedMinutes: 240, TaskMinutes: 120, TaskCount: 1, FinishedCount: 0, PlannedMinutes: 120, ActualMinutes: 180 });
    });

    it('leaves out tasks without time in the month', async () => {
        const project = await createProject(s.manager.user.ID, [s.user.user.ID]);
        const task = await createTask(project.ID, s.manager.user.ID, [s.user.user.ID]);
        await prisma.userTaskTime.create({
            data: { UserID: s.user.user.ID, TaskID: task.ID, StartTime: new Date(Date.UTC(2026, 9, 10, 8)), StopTime: new Date(Date.UTC(2026, 9, 10, 9)) },
        });
        const res = await s.user.agent.get(`/auth/stats/users/${s.user.user.ID}`).query(period);
        expect(res.body.Tasks).toEqual([]);
        expect(res.body.WorkedMinutes).toBe(0);
    });
});
