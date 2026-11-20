import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import { publicUserSelect } from '../access.ts';
import { notFound } from '../errors.ts';
import { date, id, idParam, parseBody, requiredText, text } from '../validation.ts';

const projectFields = {
    Name: requiredText(200),
    Description: text(5000).nullable().optional(),
    Customer: text(200).nullable().optional(),
    FinishDate: date.nullable().optional(),
    OwnerID: id,
};

const createProjectSchema = z.object(projectFields);

// ADMIN and MANAGER (see app.ts)
export const createProject = async (req: Request, res: Response) => {
    const project = parseBody(createProjectSchema, req.body);
    await prisma.project.create({
        data: {
            ...project,
            Finished: false,
        },
    });
    return res.status(200).send();
};

export const getProjects = async (req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
        where: {
            Deleted: false,
        },
        select: {
            ID: true,
            Name: true,
            Customer: true,
            FinishDate: true,
            Finished: true,
        },
        orderBy: {
            Name: 'asc',
        },
    });
    return res.status(200).send(projects);
};

export const getProject = async (req: Request, res: Response) => {
    const project = await prisma.project.findFirst({
        where: {
            ID: idParam(req, 'projectID'),
            Deleted: false,
        },
        include: {
            Member: {
                select: {
                    User: { select: publicUserSelect },
                },
            },
        },
    });
    if (!project) throw notFound();
    return res.status(200).send(project);
};

const updateProjectSchema = z.object({
    Name: projectFields.Name.optional(),
    Description: projectFields.Description,
    Customer: projectFields.Customer,
    FinishDate: projectFields.FinishDate,
    Finished: z.boolean().optional(),
    OwnerID: id.optional(),
    Members: z
        .array(z.object({ UserID: id }))
        .max(1000)
        .optional(),
});

// ADMIN and MANAGER (see app.ts)
export const updateProject = async (req: Request, res: Response) => {
    const projectID = idParam(req, 'projectID');
    const { Members, ...data } = parseBody(updateProjectSchema, req.body);
    await prisma.project.update({
        where: {
            ID: projectID,
            Deleted: false,
        },
        data: {
            ...data,
            ...(Members && {
                Member: {
                    deleteMany: {},
                    createMany: {
                        data: [...new Set(Members.map((member) => member.UserID))].map((UserID) => ({ UserID })),
                    },
                },
            }),
        },
    });
    return res.status(200).send();
};

// ADMIN only (see app.ts)
export const removeProject = async (req: Request, res: Response) => {
    await prisma.project.update({
        where: {
            ID: idParam(req, 'projectID'),
        },
        data: {
            Deleted: true,
        },
    });
    return res.status(200).send();
};
