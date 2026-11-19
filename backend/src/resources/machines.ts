import type { Request, Response } from 'express';
import { getToken } from './utilities.ts';
import prisma from '../client.ts';
import { verifyUser } from '../auth.ts';
import { exceptionHandler } from '../exceptionHandler.ts';

export const createMachine = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.machine.create({
        data: {
            ...req.body,
        },
    });
    return res.status(200).send();
});

export const getMachines = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const machines = await prisma.machine.findMany({
        where: {
            Deleted: false,
        },
        select: {
            ID: true,
            Name: true,
        },
    });
    return res.status(200).send(machines);
});

export const getMachine = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const machine = await prisma.machine.findUnique({
        where: {
            ID: +req.params.machineID,
        },
        include: {
            Task: {
                include: {
                    Owner: {
                        select: {
                            FirstName: true,
                            LastName: true,
                        },
                    },
                    Project: {
                        select: {
                            Name: true,
                        },
                    },
                },
            },
        },
    });
    return res.status(200).send(machine);
});

export const updateMachine = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.machine.update({
        where: {
            ID: +req.params.machineID,
        },
        data: {
            ...req.body,
        },
    });
    return res.status(200).send();
});

export const removeMachine = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.machine.update({
        where: {
            ID: +req.params.machineID,
        },
        data: {
            Deleted: true,
        },
    });
    return res.status(200).send();
});
