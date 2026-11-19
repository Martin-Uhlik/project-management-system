import crypto from 'node:crypto';
import prisma from './client.ts';

export const calculateSalt = () => {
    return crypto.randomUUID();
};

export const calculateHash = (password: string, salt: string) => {
    return crypto
        .createHash('sha256')
        .update(password + salt)
        .digest('hex');
};

export class AuthError extends Error {}

export const verifyUser = async (token: string) => {
    const match = await prisma.userSession.findFirst({
        where: {
            Token: token,
        },
    });
    if (!match) {
        throw new AuthError('403');
    }
};
