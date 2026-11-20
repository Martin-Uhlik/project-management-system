import type { Request, Response } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import prisma from '../client.ts';
import { currentUser, deleteUserSessions, hashPassword, hasRole, MIN_PASSWORD_LENGTH, requireSelf } from '../auth.ts';
import { publicUserSelect, taskProgressCount } from '../access.ts';
import { badRequest, forbidden } from '../errors.ts';
import { date, id, idParam, parseBody, requiredText, sentKeys } from '../validation.ts';

dayjs.extend(isoWeek);

const userType = z.enum(['ADMIN', 'MANAGER', 'USER']);

const createUserSchema = z.object({
    user: z.object({
        UserName: requiredText(100),
        FirstName: requiredText(100),
        LastName: requiredText(100),
        Password: z.string().min(MIN_PASSWORD_LENGTH).max(1000),
        Position: z.string().trim().max(200).default(''),
        UserType: userType,
        ManagerID: id.nullable().optional(),
    }),
});

// ADMIN only (see app.ts)
export const createUser = async (req: Request, res: Response) => {
    const { user } = parseBody(createUserSchema, req.body);
    await prisma.user.create({
        data: {
            UserName: user.UserName,
            FirstName: user.FirstName,
            LastName: user.LastName,
            PasswordHash: await hashPassword(user.Password),
            Enabled: true,
            Position: user.Position,
            UserType: user.UserType,
            ManagerID: user.ManagerID ?? null,
        },
    });
    return res.status(200).send();
};

export const getUser = async (req: Request, res: Response) => {
    const start = dayjs().startOf('isoWeek');
    const stop = dayjs().endOf('isoWeek');
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            ID: idParam(req, 'userID'),
        },
        select: {
            ...publicUserSelect,
            WorkTime: {
                where: {
                    StartTime: {
                        gte: start.toDate(),
                        lt: stop.toDate(),
                    },
                },
            },
            User_Task: {
                include: {
                    // the project name is shown in the work plan chart's tooltip
                    Task: { include: { ...taskProgressCount, Project: { select: { Name: true } } } },
                },
            },
        },
    });

    return res.status(200).send(user);
};

export const getUsers = async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        where: { Deleted: false },
        select: publicUserSelect,
    });
    return res.status(200).send(users);
};

// What an admin may change on an account; everyone may only start or stop their own work timer and pick the task
// they are working on (CurrentTaskID, one of their assigned tasks)
const adminUpdateSchema = z.object({
    UserName: requiredText(100).optional(),
    FirstName: requiredText(100).optional(),
    LastName: requiredText(100).optional(),
    Position: z.string().trim().max(200).optional(),
    UserType: userType.optional(),
    Enabled: z.boolean().optional(),
    WorkStartTime: date.nullable().optional(),
    CurrentTaskID: id.nullable().optional(),
    ManagerID: id.nullable().optional(),
});
const SELF_FIELDS = ['WorkStartTime', 'CurrentTaskID'];

export const updateUser = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    const me = currentUser(res);
    const keys = sentKeys(req.body);

    if (!hasRole(me, 'ADMIN')) {
        if (me.ID !== userID || keys.some((key) => !SELF_FIELDS.includes(key))) throw forbidden();
    }
    const data = parseBody(adminUpdateSchema, req.body);
    // an admin can't lock themselves out
    if (me.ID === userID && ((data.UserType && data.UserType !== 'ADMIN') || data.Enabled === false)) {
        throw badRequest('Vlastní roli ani přístup nelze změnit.');
    }
    if (data.ManagerID === userID) throw badRequest('Pracovník nemůže být sám sobě vedoucím.');
    if (data.CurrentTaskID) {
        const assignment = await prisma.user_Task.findFirst({ where: { UserID: userID, TaskID: data.CurrentTaskID }, select: { ID: true } });
        if (!assignment) throw badRequest('Úkol není uživateli přiřazen.');
    }

    await prisma.user.update({
        where: { ID: userID },
        data,
    });
    if (data.Enabled === false) {
        await deleteUserSessions(userID);
    }
    return res.status(200).send();
};

const logTimeSchema = z
    .object({
        WorkStartTime: date,
        WorkStopTime: date,
    })
    .refine((time) => time.WorkStopTime >= time.WorkStartTime, { message: 'Konec práce je před začátkem.', path: ['WorkStopTime'] });

// Users log their own work time only
export const logTime = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    requireSelf(res, userID);
    const time = parseBody(logTimeSchema, req.body);

    // the time also counts for the task the user started the timer on, if any
    const user = await prisma.user.findUnique({ where: { ID: userID }, select: { CurrentTaskID: true } });
    const period = { StartTime: time.WorkStartTime, StopTime: time.WorkStopTime, UserID: userID };

    await prisma.$transaction([
        prisma.user.update({
            where: { ID: userID },
            data: { WorkStartTime: null, CurrentTaskID: null },
        }),
        prisma.workTime.create({ data: period }),
        ...(user?.CurrentTaskID ? [prisma.userTaskTime.create({ data: { ...period, TaskID: user.CurrentTaskID } })] : []),
    ]);
    return res.status(200).send();
};
