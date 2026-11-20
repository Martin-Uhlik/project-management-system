import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { taskProgressCount } from '../access.ts';
import { notFound } from '../errors.ts';
import { idParam, parseBody, requiredText, text } from '../validation.ts';

const createMachineSchema = z.object({
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
});

// ADMIN only (see app.ts)
export const createMachine = async (req: Request, res: Response) => {
    const machine = parseBody(createMachineSchema, req.body);
    await prisma.machine.create({
        data: machine,
    });
    return res.status(200).send();
};

export const getMachines = async (req: Request, res: Response) => {
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
};

export const getMachine = async (req: Request, res: Response) => {
    const machine = await prisma.machine.findFirst({
        where: {
            ID: idParam(req, 'machineID'),
            Deleted: false,
        },
        include: {
            Task: {
                include: {
                    ...taskProgressCount,
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
    if (!machine) throw notFound();
    return res.status(200).send(machine);
};

const updateMachineSchema = createMachineSchema.partial();

// ADMIN and MANAGER (see app.ts)
export const updateMachine = async (req: Request, res: Response) => {
    await prisma.machine.update({
        where: {
            ID: idParam(req, 'machineID'),
            Deleted: false,
        },
        data: parseBody(updateMachineSchema, req.body),
    });
    return res.status(200).send();
};

// ADMIN only (see app.ts)
export const removeMachine = async (req: Request, res: Response) => {
    await prisma.machine.update({
        where: {
            ID: idParam(req, 'machineID'),
        },
        data: {
            Deleted: true,
        },
    });
    return res.status(200).send();
};
