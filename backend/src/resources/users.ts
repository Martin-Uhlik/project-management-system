import type { Request, Response } from 'express';
import { z } from 'zod';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import prisma from '../client.ts';
import { currentUser, deleteUserSessions, hashPassword, hasRole, MIN_PASSWORD_LENGTH, requireSelf } from '../auth.ts';
import { publicUserSelect } from '../access.ts';
import { badRequest, forbidden } from '../errors.ts';
import { date, idParam, parseBody, requiredText, sentKeys } from '../validation.ts';

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
                    Task: true,
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

// What an admin may change on an account; everyone may only start or stop their own work timer
const adminUpdateSchema = z.object({
    UserName: requiredText(100).optional(),
    FirstName: requiredText(100).optional(),
    LastName: requiredText(100).optional(),
    Position: z.string().trim().max(200).optional(),
    UserType: userType.optional(),
    Enabled: z.boolean().optional(),
    WorkStartTime: date.nullable().optional(),
});
const SELF_FIELDS = ['WorkStartTime'];

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

    await prisma.$transaction([
        prisma.user.update({
            where: { ID: userID },
            data: { WorkStartTime: null },
        }),
        prisma.workTime.create({
            data: {
                StartTime: time.WorkStartTime,
                StopTime: time.WorkStopTime,
                UserID: userID,
            },
        }),
    ]);
    return res.status(200).send();
};
