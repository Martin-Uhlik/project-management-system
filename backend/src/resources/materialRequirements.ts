import type { Request, Response } from 'express';
import { getToken } from './utilities.ts';
import prisma from '../client.ts';
import { verifyUser } from '../auth.ts';
import { exceptionHandler } from '../exceptionHandler.ts';

export const createMaterialRequirement = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.materialRequest.create({
        data: {
            ...req.body,
            AddedDate: new Date(),
        },
    });
    return res.status(200).send();
});

export const getMaterialRequirements = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const materialRequests = await prisma.materialRequest.findMany({
        orderBy: {
            Name: 'asc',
        },
        include: {
            TargetUser: true,
            AcceptedBy: true,
        },
    });
    return res.status(200).send(materialRequests);
});

export const updateMaterialRequirement = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.materialRequest.update({
        where: {
            ID: +req.params.materialRequirementID,
        },
        data: {
            ...req.body,
        },
    });
    return res.status(200).send();
});

export const removeMaterialRequirement = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.materialRequest.delete({
        where: {
            ID: +req.params.materialRequirementID,
        },
    });
    return res.status(200).send();
});
