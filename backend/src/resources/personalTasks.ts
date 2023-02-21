import {Request, Response} from "express";
import {getToken} from "./utilities";
import prisma from "../client";
import {verifyUser} from "../auth";
import {exceptionHandler} from "../exceptionHandler";

export const createTask = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.privateTask.create({
        data: {
            ...req.body.task,
            Finished: false,
            UserID: +req.params.userID
        }
    })
    return res.status(200).send();
});

export const getTasks = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const tasks = await prisma.privateTask.findMany({
        where: {
            UserID: +req.params.userID
        }
    })
    return res.status(200).send(tasks);
});


export const updateTask = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const tasks = await prisma.privateTask.update({
        where: {
            ID: +req.params.taskID
        },
        data: {
            ...req.body.task
        }
    })
    return res.status(200).send(tasks);
});

export const removeFinished = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const tasks = await prisma.privateTask.deleteMany({
        where: {
            ID: req.body.ID,
            Finished: true
        }
    })
    return res.status(200).send(tasks);
});