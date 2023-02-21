import {Request, Response} from "express";
import {getToken} from "./utilities";
import prisma from "../client";
import {verifyUser} from "../auth";
import {exceptionHandler} from "../exceptionHandler";

export const createProject = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.project.create({
        data: {
            ...req.body,
            Finished: false,
        }
    })
    return res.status(200).send();
})

export const getProjects = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const projects = await prisma.project.findMany({
        where: {
            Deleted: false
        },
        select: {
            ID: true,
            Name: true,
            Customer: true,
            FinishDate: true,
            Finished: true
        },
        orderBy: {
            Name: "asc"
        }
    })
    return res.status(200).send(projects)
})

export const getProject = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const project = await prisma.project.findUnique({
        where: {
            ID: +req.params.projectID
        },
        include: {
            Memeber: {
                select: {
                    User: true
                }
            }
        }
    })
    return res.status(200).send(project)
})

export const updateProject = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.project.update({
        where: {
            ID: +req.params.projectID
        },
        data: {
            Name: req.body.Name,
            Description: req.body.Description,
            Customer: req.body.Customer,
            FinishDate: req.body.FinishDate,
            Finished: req.body.Finished,
            OwnerID: req.body.OwnerID,
            Memeber: {
                deleteMany: {
                    ProjectID: +req.params.projectID
                },
                createMany: {
                    data: req.body.Members
                }
            }
        }
    })
    return res.status(200).send()
})

export const removeProject = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.project.update({
        where: {
            ID: +req.params.projectID
        },
        data: {
            Deleted: true
        }
    })
    return res.status(200).send()
})