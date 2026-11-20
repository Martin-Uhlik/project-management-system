import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { requireSelf } from '../auth.ts';
import { notFound } from '../errors.ts';
import { date, idParam, parseBody, requiredText, text } from '../validation.ts';

// Personal tasks are private: only their owner can see or change them

const taskFields = {
    Name: requiredText(200),
    Description: text(5000).default(''),
    FinishDate: date,
};

const createSchema = z.object({ task: z.object(taskFields) });

export const createTask = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    requireSelf(res, userID);
    const { task } = parseBody(createSchema, req.body);
    await prisma.privateTask.create({
        data: {
            ...task,
            Finished: false,
            UserID: userID,
        },
    });
    return res.status(200).send();
};

export const getTasks = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    requireSelf(res, userID);
    const tasks = await prisma.privateTask.findMany({
        where: {
            UserID: userID,
        },
    });
    return res.status(200).send(tasks);
};

const updateSchema = z.object({
    task: z.object({
        Name: taskFields.Name.optional(),
        Description: text(5000).optional(),
        FinishDate: date.optional(),
        Finished: z.boolean().optional(),
    }),
});

export const updateTask = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    requireSelf(res, userID);
    const { task } = parseBody(updateSchema, req.body);
    const updated = await prisma.privateTask.updateManyAndReturn({
        where: {
            ID: idParam(req, 'taskID'),
            UserID: userID,
        },
        data: task,
    });
    if (updated.length === 0) throw notFound();
    return res.status(200).send(updated[0]);
};

// Deletes one of the user's personal tasks
export const removeTask = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    requireSelf(res, userID);
    const removed = await prisma.privateTask.deleteMany({
        where: {
            ID: idParam(req, 'taskID'),
            UserID: userID,
        },
    });
    if (removed.count === 0) throw notFound();
    return res.status(200).send();
};

// Deletes the user's finished personal tasks
export const removeFinished = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    requireSelf(res, userID);
    const tasks = await prisma.privateTask.deleteMany({
        where: {
            UserID: userID,
            Finished: true,
        },
    });
    return res.status(200).send(tasks);
};
