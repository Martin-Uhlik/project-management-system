import {Request, Response} from "express";
import {v4 as uuidv4} from 'uuid';
import prisma from '../client';

import crypto from "crypto";
import {verifyUser} from "../auth";
import {exceptionHandler} from "../exceptionHandler";

const cookieLifetime = 20 * 60 * 60 * 1000;
const sendCookieLifetime = cookieLifetime / 60 / 60 / 1000 / 24

const calculateSalt = () => {
    return uuidv4();
}

const calculateHash = (password: string, salt: string) => {
    return crypto.createHash('sha256').update(password + salt).digest('hex')
}

const calculateToken = () => {
    return uuidv4();
}

export const getToken: (req: Request) => string = (req: Request) => {
    return req.headers["authorization"]?.split(" ")[1] || "";
}

export const login = exceptionHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
        where: {
            UserName: req.body.name
        }
    })

    if (!user || user.PasswordHash !== calculateHash(req.body.password, user.PasswordSalt)) {
        res.status(403);
        return res.send({errorMessage: "Nesprávné přihlašovací údaje."});
    }

    if (!user.Enabled) {
        res.status(403);
        return res.send({errorMessage: "Uživatel zablokován."});
    }

    const userSession = await prisma.userSession.create({
        data: {
            Token: calculateToken(),
            Expires: new Date(Date.now() + cookieLifetime),
            UserID: user.ID
        }
    })

    return res.status(200).send({
        cookie: {
            name: "auth",
            key: userSession.Token,
            params: {
                Path: "/",
                expires: sendCookieLifetime,
                sameSite: "Lax"
            }
        },
        userId: {
            name: "user_id",
            key: user.ID,
            params: {
                Path: "/",
                expires: sendCookieLifetime,
                sameSite: "Lax"
            }
        }
    });
});

export const logout = exceptionHandler(async (req: Request, res: Response) => {
    const token = getToken(req);
    await verifyUser(token);
    await prisma.userSession.delete({
        where: {
            Token: token
        }
    })

    res.status(200).send({
        cookie: {
            name: "auth",
            key: "",
            params: {
                Path: "/",
                expires: 0,
                sameSite: "Lax"
            }
        },
        userId: {
            name: "user_id",
            key: "",
            params: {
                Path: "/",
                expires: 0,
                sameSite: "Lax"
            }
        }
    });
});

export const setPassword = exceptionHandler(async (req: Request, res: Response) => {
    await verifyUser(getToken(req));
    const user = await prisma.user.findUnique({
        where: {
            ID: +req.params.userID
        }
    })

    if (!user || user.PasswordHash !== calculateHash(req.body.oldPassword, user.PasswordSalt)) {
        res.status(403);
        return res.send({errorMessage: "Nesprávné přihlašovací údaje."});
    }

    const salt = calculateSalt()
    await prisma.user.update({
        where: {
            ID: user.ID
        },
        data: {
            PasswordSalt: salt,
            PasswordHash: calculateHash(req.body.newPassword, salt)
        }
    })

    return res.status(200).send()
});
