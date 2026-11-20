import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser } from '../auth.ts';
import { requireTaskAccessByID } from '../access.ts';
import { count, id, idParam, parseBody, requiredText } from '../validation.ts';
import { notFound } from '../errors.ts';

const createMaterialSchema = z.object({
    Name: requiredText(200),
    Count: count,
});

// ADMIN and MANAGER (see app.ts); the stock entry is recorded as made by the signed-in user
export const createMaterial = async (req: Request, res: Response) => {
    const material = parseBody(createMaterialSchema, req.body);
    await prisma.material.create({
        data: {
            Name: material.Name,
            MaterialEvent: {
                create: {
                    Count: material.Count,
                    TargetUserID: currentUser(res).ID,
                    EventType: 'ADD',
                },
            },
        },
    });
    return res.status(200).send();
};

export const getMaterials = async (req: Request, res: Response) => {
    const materials = await prisma.material.findMany({
        include: {
            MaterialEvent: true,
        },
        orderBy: {
            Name: 'asc',
        },
    });
    return res.status(200).send(materials);
};

// ADMIN and MANAGER (see app.ts)
export const updateMaterial = async (req: Request, res: Response) => {
    await prisma.material.update({
        where: {
            ID: idParam(req, 'materialID'),
        },
        data: parseBody(z.object({ Name: requiredText(200) }), req.body),
    });
    return res.status(200).send();
};

const eventSchema = z.object({
    Count: count,
    EventType: z.enum(['ADD', 'REMOVE', 'RESERVATION']),
    TargetTaskID: id.nullable().optional(),
});

// Stock movements (add, take out, reserve for a task): everyone, recorded as made by the signed-in user
export const eventMaterial = async (req: Request, res: Response) => {
    const materialID = idParam(req, 'materialID');
    const event = parseBody(eventSchema, req.body);
    const me = currentUser(res);
    if (!(await prisma.material.findUnique({ where: { ID: materialID }, select: { ID: true } }))) throw notFound();
    if (event.TargetTaskID) {
        await requireTaskAccessByID(me, event.TargetTaskID);
    }
    await prisma.materialEvent.create({
        data: {
            ...event,
            TargetUserID: me.ID,
            MaterialID: materialID,
        },
    });
    return res.status(200).send();
};

export const getTaskMaterial = async (req: Request, res: Response) => {
    const taskID = idParam(req, 'taskID');
    await requireTaskAccessByID(currentUser(res), taskID);
    const materials = await prisma.materialEvent.findMany({
        where: {
            TargetTaskID: taskID,
        },
        include: {
            Material: true,
        },
    });
    return res.status(200).send(materials);
};
