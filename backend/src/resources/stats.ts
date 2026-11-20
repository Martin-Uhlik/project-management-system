import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser, hasRole, type SessionUser } from '../auth.ts';
import { publicUserSelect, taskProgressCount } from '../access.ts';
import { badRequest, forbidden } from '../errors.ts';
import { date, idParam } from '../validation.ts';

// Worker statistics for a period (the browser asks for one calendar month in its own time zone): time worked, the
// tasks worked on and their planned against actual time.
// Who sees whose: everyone sees their own, a manager (vedoucí) also everyone under them (ManagerID, all levels down),
// an admin everyone.

const MAX_PERIOD_DAYS = 62;

const periodSchema = z
    .object({ from: date, to: date })
    .refine((period) => period.to > period.from, { message: 'Konec období je před začátkem.', path: ['to'] })
    .refine((period) => period.to.getTime() - period.from.getTime() <= MAX_PERIOD_DAYS * 24 * 60 * 60 * 1000, {
        message: 'Období je příliš dlouhé.',
        path: ['to'],
    });

const parsePeriod = (req: Request) => {
    const parsed = periodSchema.safeParse(req.query);
    if (!parsed.success) throw badRequest('Neplatné období (from, to).');
    return parsed.data;
};

// The IDs of the users whose statistics the signed-in user may see (themselves first)
export const visibleStatsUserIDs = async (me: SessionUser): Promise<number[]> => {
    const users = await prisma.user.findMany({ where: { Deleted: false }, select: { ID: true, ManagerID: true } });
    if (hasRole(me, 'ADMIN')) return [me.ID, ...users.map((user) => user.ID).filter((id) => id !== me.ID)];
    // everyone under me, level by level (a loop in the managers can't make this run forever: each ID is taken once)
    const visible = [me.ID];
    const seen = new Set(visible);
    for (let index = 0; index < visible.length; index++) {
        for (const user of users) {
            if (user.ManagerID === visible[index] && !seen.has(user.ID)) {
                seen.add(user.ID);
                visible.push(user.ID);
            }
        }
    }
    return visible;
};

type Interval = { StartTime: Date; StopTime: Date | null };

// Minutes of an interval inside [from, to), a record without an end (still running) counts until now
const minutesIn = (interval: Interval, from: Date, to: Date, now: Date) => {
    const start = Math.max(interval.StartTime.getTime(), from.getTime());
    const stop = Math.min((interval.StopTime ?? now).getTime(), to.getTime(), now.getTime());
    return Math.max(0, (stop - start) / 60000);
};
const overlapping = (from: Date, to: Date) => ({ StartTime: { lt: to }, OR: [{ StopTime: null }, { StopTime: { gt: from } }] });

// The statistics of these users in the period: worked time (WorkTime, plus the timer running now), and per user the tasks
// they logged time on in the period with the user's share of the task's plan (the plan split equally among the assigned
// workers, as on the project statistics), their time on it in the period and in total
const computeStats = async (userIDs: number[], from: Date, to: Date) => {
    const now = new Date();
    const users = await prisma.user.findMany({
        where: { ID: { in: userIDs } },
        select: {
            ...publicUserSelect,
            Manager: { select: { ID: true, FirstName: true, LastName: true } },
            WorkTime: { where: overlapping(from, to), select: { StartTime: true, StopTime: true }, orderBy: { StartTime: 'asc' } },
        },
    });
    const records = await prisma.userTaskTime.findMany({
        where: { UserID: { in: userIDs }, ...overlapping(from, to) },
        select: { UserID: true, TaskID: true },
    });

    // the timer running now counts as work (and as work on the task it was started on), like a record without an end
    const running = (user: (typeof users)[number]) => (user.WorkStartTime ? { StartTime: user.WorkStartTime, StopTime: null } : null);
    const tasksOf = new Map<number, Set<number>>(userIDs.map((id) => [id, new Set()]));
    for (const record of records) tasksOf.get(record.UserID)?.add(record.TaskID);
    for (const user of users) {
        const timer = running(user);
        if (timer && user.CurrentTaskID && minutesIn(timer, from, to, now) > 0) tasksOf.get(user.ID)?.add(user.CurrentTaskID);
    }

    const taskIDs = [...new Set([...tasksOf.values()].flatMap((ids) => [...ids]))];
    const tasks = await prisma.task.findMany({
        where: { ID: { in: taskIDs } },
        select: {
            ID: true,
            Name: true,
            Finished: true,
            FinishDate: true,
            DurationHours: true,
            DurationMinutes: true,
            ...taskProgressCount,
            Project: { select: { ID: true, Name: true } },
            User_Task: { select: { UserID: true } },
            UserTaskTime: { where: { UserID: { in: userIDs } }, select: { UserID: true, StartTime: true, StopTime: true } },
        },
        orderBy: { Name: 'asc' },
    });
    const always = { from: new Date(0), to: new Date(8.64e15) };

    return users.map((user) => {
        const timer = running(user);
        const { WorkTime, ...rest } = user;
        const workIntervals: Interval[] = [...WorkTime, ...(timer ? [timer] : [])];
        const userTasks = tasks
            .filter((task) => tasksOf.get(user.ID)?.has(task.ID))
            .map((task) => {
                const own: Interval[] = task.UserTaskTime.filter((record) => record.UserID === user.ID);
                if (timer && user.CurrentTaskID === task.ID) own.push(timer);
                const planned = task.DurationHours * 60 + task.DurationMinutes;
                const assigned = new Set(task.User_Task.map((assignment) => assignment.UserID));
                // the user's part of the plan; none when the task has no estimate or the user isn't assigned to it
                const share = planned && assigned.has(user.ID) ? planned / assigned.size : null;
                return {
                    ID: task.ID,
                    Name: task.Name,
                    Finished: task.Finished,
                    FinishDate: task.FinishDate,
                    _count: task._count,
                    Project: task.Project,
                    PlannedMinutes: share,
                    PeriodMinutes: own.reduce((sum, interval) => sum + minutesIn(interval, from, to, now), 0),
                    TotalMinutes: own.reduce((sum, interval) => sum + minutesIn(interval, always.from, always.to, now), 0),
                };
            })
            .sort((a, b) => b.PeriodMinutes - a.PeriodMinutes);
        return {
            User: rest,
            WorkedMinutes: workIntervals.reduce((sum, interval) => sum + minutesIn(interval, from, to, now), 0),
            // the work periods cut to the period, for the chart by day (the browser groups them in its time zone)
            WorkTime: workIntervals
                .map((interval) => ({
                    StartTime: new Date(Math.max(interval.StartTime.getTime(), from.getTime())),
                    StopTime: new Date(Math.min((interval.StopTime ?? now).getTime(), to.getTime(), now.getTime())),
                }))
                .filter((interval) => interval.StopTime > interval.StartTime),
            Tasks: userTasks,
        };
    });
};

// The people the signed-in user may see, with their totals for the period (yourself first, the rest by name)
export const getStatsPeople = async (req: Request, res: Response) => {
    const me = currentUser(res);
    const { from, to } = parsePeriod(req);
    const ids = await visibleStatsUserIDs(me);
    const stats = await computeStats(ids, from, to);
    const people = stats
        .map(({ User, WorkedMinutes, Tasks }) => {
            const planned = Tasks.filter((task) => task.PlannedMinutes !== null);
            return {
                User,
                WorkedMinutes,
                TaskMinutes: Tasks.reduce((sum, task) => sum + task.PeriodMinutes, 0),
                TaskCount: Tasks.length,
                FinishedCount: Tasks.filter((task) => task.Finished).length,
                // planned against actual (all the time logged) for the period's tasks that have a plan
                PlannedMinutes: planned.reduce((sum, task) => sum + (task.PlannedMinutes ?? 0), 0),
                ActualMinutes: planned.reduce((sum, task) => sum + task.TotalMinutes, 0),
            };
        })
        .sort(
            (a, b) =>
                Number(b.User.ID === me.ID) - Number(a.User.ID === me.ID) ||
                a.User.LastName.localeCompare(b.User.LastName, 'cs') ||
                a.User.FirstName.localeCompare(b.User.FirstName, 'cs'),
        );
    return res.status(200).send(people);
};

// One person's statistics for the period: only for themselves, their managers and admins
export const getUserStats = async (req: Request, res: Response) => {
    const me = currentUser(res);
    const userID = idParam(req, 'userID');
    const { from, to } = parsePeriod(req);
    const ids = await visibleStatsUserIDs(me);
    if (!ids.includes(userID)) throw forbidden();
    const [stats] = await computeStats([userID], from, to);
    return res.status(200).send(stats);
};
