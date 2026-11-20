import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser, isManager } from '../auth.ts';
import { publicUserSelect, requireTaskAccessByID } from '../access.ts';
import { forbidden, notFound } from '../errors.ts';
import { count, date, id, idParam, parseBody, requiredText, text } from '../validation.ts';

const requirementFields = {
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
    Count: count,
    Price: z.number().int().min(0).max(1_000_000_000),
    NeededDate: date.nullable().optional(),
};

const createSchema = z.object({
    ...requirementFields,
    TargetTaskID: id.nullable().optional(),
});

// ADMIN and MANAGER (see app.ts); the request is recorded as made by the signed-in user
export const createMaterialRequirement = async (req: Request, res: Response) => {
    const requirement = parseBody(createSchema, req.body);
    const me = currentUser(res);
    if (requirement.TargetTaskID) {
        await requireTaskAccessByID(me, requirement.TargetTaskID);
    }
    await prisma.materialRequest.create({
        data: {
            ...requirement,
            TargetUserID: me.ID,
            AddedDate: new Date(),
        },
    });
    return res.status(200).send();
};

export const getMaterialRequirements = async (req: Request, res: Response) => {
    const materialRequests = await prisma.materialRequest.findMany({
        orderBy: {
            Name: 'asc',
        },
        include: {
            TargetUser: { select: publicUserSelect },
            AcceptedBy: { select: publicUserSelect },
        },
    });
    return res.status(200).send(materialRequests);
};

// Who may change or remove a request: admins, managers and whoever made it
const findOwnRequirement = async (req: Request, res: Response) => {
    const requirement = await prisma.materialRequest.findUnique({ where: { ID: idParam(req, 'materialRequirementID') } });
    if (!requirement) throw notFound();
    const me = currentUser(res);
    if (!isManager(me) && requirement.TargetUserID !== me.ID) throw forbidden();
    return requirement;
};

const updateSchema = z.object({
    Name: requirementFields.Name.optional(),
    Description: requirementFields.Description,
    Count: requirementFields.Count.optional(),
    Price: requirementFields.Price.optional(),
    NeededDate: requirementFields.NeededDate,
    // accepting (ADMIN and MANAGER) records the signed-in user and the time
    Accepted: z.literal(true).optional(),
});

export const updateMaterialRequirement = async (req: Request, res: Response) => {
    const requirement = await findOwnRequirement(req, res);
    const { Accepted, ...data } = parseBody(updateSchema, req.body);
    const me = currentUser(res);
    if (Accepted && !isManager(me)) throw forbidden();
    await prisma.materialRequest.update({
        where: {
            ID: requirement.ID,
        },
        data: {
            ...data,
            ...(Accepted && { AcceptedByID: me.ID, AcceptedDate: new Date() }),
        },
    });
    return res.status(200).send();
};

export const removeMaterialRequirement = async (req: Request, res: Response) => {
    const requirement = await findOwnRequirement(req, res);
    await prisma.materialRequest.delete({
        where: {
            ID: requirement.ID,
        },
    });
    return res.status(200).send();
};
