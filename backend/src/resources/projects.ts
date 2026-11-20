import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser } from '../auth.ts';
import { projectWork, projectWorkSelect, publicUserSelect, requireProjectAccess, taskProgressCount } from '../access.ts';
import { notFound } from '../errors.ts';
import { date, id, idParam, parseBody, requiredText, text } from '../validation.ts';

const projectFields = {
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
    Customer: text(200).nullable().optional(),
    FinishDate: date.nullable().optional(),
    OwnerID: id,
};

const createProjectSchema = z.object(projectFields);

// ADMIN and MANAGER (see app.ts)
export const createProject = async (req: Request, res: Response) => {
    const project = parseBody(createProjectSchema, req.body);
    await prisma.project.create({
        data: {
            ...project,
            Finished: false,
        },
    });
    return res.status(200).send();
};

export const getProjects = async (req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
        where: {
            Deleted: false,
        },
        select: {
            ID: true,
            Name: true,
            Customer: true,
            FinishDate: true,
            Finished: true,
            ...projectWorkSelect,
        },
        orderBy: {
            Name: 'asc',
        },
    });
    return res.status(200).send(projects.map(projectWork));
};

export const getProject = async (req: Request, res: Response) => {
    const project = await prisma.project.findFirst({
        where: {
            ID: idParam(req, 'projectID'),
            Deleted: false,
        },
        include: {
            Owner: { select: publicUserSelect },
            Member: {
                select: {
                    User: { select: publicUserSelect },
                },
            },
            ...projectWorkSelect,
        },
    });
    if (!project) throw notFound();
    return res.status(200).send(projectWork(project));
};

const updateProjectSchema = z.object({
    Name: projectFields.Name.optional(),
    Description: projectFields.Description,
    Customer: projectFields.Customer,
    FinishDate: projectFields.FinishDate,
    Finished: z.boolean().optional(),
    OwnerID: id.optional(),
    Members: z
        .array(z.object({ UserID: id }))
        .max(1000)
        .optional(),
});

// ADMIN and MANAGER (see app.ts)
export const updateProject = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    const { Members, ...data } = parseBody(updateProjectSchema, req.body);
    await prisma.project.update({
        where: {
            ID: projectID,
            Deleted: false,
        },
        data: {
            ...data,
            ...(Members && {
                Member: {
                    deleteMany: {},
                    createMany: {
                        data: [...new Set(Members.map((member) => member.UserID))].map((UserID) => ({ UserID })),
                    },
                },
            }),
        },
    });
    return res.status(200).send();
};

// ADMIN only (see app.ts)
export const removeProject = async (req: Request, res: Response) => {
    await prisma.project.update({
        where: {
            ID: idParam(req, 'projectID'),
        },
        data: {
            Deleted: true,
        },
    });
    return res.status(200).send();
};

const minutesBetween = (start: Date, stop: Date) => Math.max(0, (stop.getTime() - start.getTime()) / 60000);

// The project's statistics: planned time (the tasks' durations) against the time actually logged on its tasks,
// for the whole project, per worker and per task (with its deadline and assigned workers, for the task list). Times are in minutes; a timer that is still running counts until now.
// A task's planned time is shared equally among the workers assigned to it, so the workers' plans add up to the project's.
export const getProjectStats = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    await requireProjectAccess(currentUser(res), projectID);
    const now = new Date();
    const tasks = await prisma.task.findMany({
        where: { ProjectID: projectID },
        select: {
            ID: true,
            Name: true,
            Finished: true,
            FinishDate: true,
            DurationHours: true,
            DurationMinutes: true,
            ...taskProgressCount,
            User_Task: { select: { UserID: true, User: { select: { ID: true, FirstName: true, LastName: true } } } },
            UserTaskTime: { select: { UserID: true, StartTime: true, StopTime: true } },
        },
        orderBy: { Name: 'asc' },
    });

    type WorkerStats = { UserID: number; PlannedMinutes: number; ActualMinutes: number; Tasks: Set<number> };
    const workers = new Map<number, WorkerStats>();
    const worker = (UserID: number) => {
        let stats = workers.get(UserID);
        if (!stats) {
            stats = { UserID, PlannedMinutes: 0, ActualMinutes: 0, Tasks: new Set() };
            workers.set(UserID, stats);
        }
        return stats;
    };

    const taskStats = tasks.map((task) => {
        const planned = task.DurationHours * 60 + task.DurationMinutes;
        const assigned = [...new Set(task.User_Task.map((assignment) => assignment.UserID))];
        for (const UserID of assigned) {
            const stats = worker(UserID);
            stats.PlannedMinutes += planned / assigned.length;
            stats.Tasks.add(task.ID);
        }
        let actual = 0;
        for (const record of task.UserTaskTime) {
            const minutes = minutesBetween(record.StartTime, record.StopTime ?? now);
            actual += minutes;
            const stats = worker(record.UserID);
            stats.ActualMinutes += minutes;
            stats.Tasks.add(task.ID);
        }
        return {
            ID: task.ID,
            Name: task.Name,
            Finished: task.Finished,
            FinishDate: task.FinishDate,
            _count: task._count,
            Workers: task.User_Task.map((assignment) => assignment.User),
            PlannedMinutes: planned,
            ActualMinutes: actual,
        };
    });

    const users = await prisma.user.findMany({
        where: { ID: { in: [...workers.keys()] } },
        select: publicUserSelect,
    });
    const workerStats = users
        .map((user) => {
            const stats = workers.get(user.ID)!;
            return { User: user, PlannedMinutes: stats.PlannedMinutes, ActualMinutes: stats.ActualMinutes, TaskCount: stats.Tasks.size };
        })
        .sort((a, b) => b.ActualMinutes - a.ActualMinutes || b.PlannedMinutes - a.PlannedMinutes);

    return res.status(200).send({
        PlannedMinutes: taskStats.reduce((sum, task) => sum + task.PlannedMinutes, 0),
        ActualMinutes: taskStats.reduce((sum, task) => sum + task.ActualMinutes, 0),
        Workers: workerStats,
        Tasks: taskStats,
    });
};
