import {Request, Response} from "express";
import prisma from "../client";
import {getToken} from "./utilities";
import {calculateHash, calculateSalt, verifyUser} from "../auth";
import moment from "moment";
import {exceptionHandler} from "../exceptionHandler";


export const createUser = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));

    const user = req.body.user
    const salt = calculateSalt()
    const hash = calculateHash(user.Password, salt)
    await prisma.user.create({
        data: {
            UserName: user.UserName,
            FirstName: user.FirstName,
            LastName: user.LastName,
            PasswordHash: hash,
            PasswordSalt: salt,
            Enabled: true,
            Position: user.Position,
            UserType: user.UserType
        }
    })
    return res.status(200).send();
})

export const getUser = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const start = moment().startOf("isoWeek")
    const stop = moment().endOf("isoWeek")
    const user = await prisma.user.findUniqueOrThrow({
        where: {
            ID: +req.params.userID
        },
        select: {
            ID: true,
            UserName: true,
            FirstName: true,
            LastName: true,
            Enabled: true,
            Position: true,
            WorkStartTime: true,
            UserType: true,
            CurrentTaskID: true,
            WorkTime: {
                where: {
                    StartTime: {
                        gte: new Date(start.toString()),
                        lt: new Date(stop.toString())
                    }
                }
            },
            User_Task: {
                include: {
                    Task: true
                }
            }
        }
    })

    return res.status(200).send(user);
})


export const getUsers = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const users = await prisma.user.findMany({
        select: {
            ID: true,
            UserName: true,
            FirstName: true,
            LastName: true,
            Enabled: true,
            Position: true,
            WorkStartTime: true,
            UserType: true,
            CurrentTaskID: true
        }
    })
    return res.status(200).send(users)
})

export const updateUser = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    await prisma.user.update({
        where: {
            ID: +req.params.userID
        },
        data: {
            ...req.body
        }
    })
    return res.status(200).send()
})

export const logTime = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const user = await prisma.user.update({
        where: {
            ID: +req.params.userID
        },
        data: {
            WorkStartTime: null
        }
    })

    await prisma.workTime.create({
        data: {
            StartTime: req.body.WorkStartTime,
            StopTime: req.body.WorkStopTime,
            UserID: user.ID
        }
    })
    return res.status(200).send()
})
