import {v4 as uuidv4} from 'uuid';
import prisma from "./client";

var crypto = require('crypto')


export const calculateSalt = () => {
    return uuidv4();
}

export const calculateHash = (password: string, salt: string) => {
    return crypto.createHash('sha256').update(password + salt).digest('hex')
}

export class AuthError extends Error {
    constructor(message: string) {
        super(message)
    }
}

export const verifyUser = async (token: string) => {
    const match = await prisma.userSession.findFirst({
        where: {
            Token: token
        }
    })
    if (!match) {
        throw new AuthError("403")
    }
}