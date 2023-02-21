import {Request, Response} from "express";
import {getToken} from "./utilities";
import prisma from "../client";
import {verifyUser} from "../auth";
import {exceptionHandler} from "../exceptionHandler";

export const createMaterial = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const material = await prisma.material.create({
        data: {
            Name: req.body.Name,
        }
    })

    await prisma.materialEvent.create({
        data: {
            Count: req.body.Count,
            TargetUserID: req.body.TargetUserID,
            MaterialID: material.ID,
            EventType: "ADD"
        }
    })
    return res.status(200).send();
});

export const getMaterials = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const materials = await prisma.material.findMany({
        include: {
            MaterialEvent: true
        },
        orderBy: {
            Name: "asc"
        }
    })
    return res.status(200).send(materials)
});

export const updateMaterial = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.material.update({
        where: {
            ID: +req.params.materialID
        },
        data: {
            Name: req.body.Name,
        }
    })
    return res.status(200).send()
});


export const eventMaterial = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.materialEvent.create({
        data: {
            ...req.body,
            MaterialID: +req.params.materialID,
        }
    })
    return res.status(200).send();
});

export const getTaskMaterial = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const materials = await prisma.materialEvent.findMany({
        where: {
            TargetTaskID: +req.params.taskID
        },
        include: {
            Material: true
        }
    })
    return res.status(200).send(materials)
});