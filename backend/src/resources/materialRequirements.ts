import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { currentUser, isManager } from '../auth.ts';
import { publicUserSelect, requireTaskAccessByID } from '../access.ts';
import { badRequest, forbidden, notFound } from '../errors.ts';
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
    // restocks this item (none: a new item)
    MaterialID: id.nullable().optional(),
});

// ADMIN and MANAGER (see app.ts); the request is recorded as made by the signed-in user
export const createMaterialRequirement = async (req: Request, res: Response) => {
    const requirement = parseBody(createSchema, req.body);
    const me = currentUser(res);
    if (requirement.TargetTaskID) {
        await requireTaskAccessByID(me, requirement.TargetTaskID);
    }
    if (requirement.MaterialID && !(await prisma.material.findUnique({ where: { ID: requirement.MaterialID }, select: { ID: true } }))) {
        throw notFound();
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
            TargetTask: { select: { ID: true, Name: true, ProjectID: true, Project: { select: { Name: true } } } },
            Material: { select: { ID: true, Name: true, Unit: true } },
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
    MaterialID: id.nullable().optional(),
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

// POST .../stock (ADMIN and MANAGER, see app.ts): an approved request has arrived. Its items go into stock - to the item
// it restocks, or to a new item made from the request - and, for a task, are reserved for it; the request is done and
// goes away. Returns the item's ID.
export const stockMaterialRequirement = async (req: Request, res: Response) => {
    const requirement = await prisma.materialRequest.findUnique({ where: { ID: idParam(req, 'materialRequirementID') } });
    if (!requirement) throw notFound();
    if (!requirement.AcceptedByID) throw badRequest('Požadavek ještě není schválený.');
    const me = currentUser(res);
    const materialID = await prisma.$transaction(async (tx) => {
        const ID =
            requirement.MaterialID ??
            (await tx.material.create({ data: { Name: requirement.Name, Description: requirement.Description, Price: requirement.Price } })).ID;
        await tx.materialEvent.create({ data: { MaterialID: ID, EventType: 'ADD', Count: requirement.Count, TargetUserID: me.ID } });
        if (requirement.TargetTaskID) {
            await tx.materialEvent.create({
                data: { MaterialID: ID, EventType: 'RESERVATION', Count: requirement.Count, TargetUserID: me.ID, TargetTaskID: requirement.TargetTaskID },
            });
        }
        await tx.materialRequest.delete({ where: { ID: requirement.ID } });
        return ID;
    });
    return res.status(200).send({ MaterialID: materialID });
};
