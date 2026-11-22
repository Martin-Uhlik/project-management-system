import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../client.ts';
import {
    burnPasswordCheck,
    clearSessionCookies,
    createSession,
    currentUser,
    deleteSession,
    deleteUserSessions,
    hashPassword,
    isLegacyHash,
    MIN_PASSWORD_LENGTH,
    requireSelf,
    setSessionCookies,
    verifyPassword,
} from '../auth.ts';
import { HttpError } from '../errors.ts';
import type { LoginLimiter } from '../rateLimit.ts';
import { idParam, parseBody } from '../validation.ts';

const loginSchema = z.object({
    name: z.string().max(200),
    password: z.string().max(1000),
});

export const login = (limiter: LoginLimiter) => async (req: Request, res: Response) => {
    const { name, password } = parseBody(loginSchema, req.body);
    const ip = req.ip ?? 'unknown';

    const wait = limiter.retryAfter(ip, name);
    if (wait > 0) {
        res.setHeader('Retry-After', String(wait));
        throw new HttpError(429, 'Příliš mnoho neúspěšných přihlášení. Zkuste to znovu později.');
    }

    const user = await prisma.user.findUnique({ where: { UserName: name } });
    const passwordOk = user ? await verifyPassword(password, user.PasswordHash, user.PasswordSalt) : await burnPasswordCheck(password);
    if (!user || user.Deleted || !passwordOk) {
        limiter.fail(ip, name);
        throw new HttpError(401, 'Nesprávné přihlašovací údaje.');
    }
    limiter.succeed(name);

    if (!user.Enabled) {
        throw new HttpError(403, 'Uživatel zablokován.');
    }

    // accounts from before scrypt: store the password the new way now that we have it
    if (isLegacyHash(user.PasswordHash)) {
        await prisma.user.update({
            where: { ID: user.ID },
            data: { PasswordHash: await hashPassword(password), PasswordSalt: null },
        });
    }

    const { token, expires } = await createSession(user.ID);
    setSessionCookies(res, token, expires, user.ID);
    return res.status(200).send({ userId: user.ID, expires });
};

export const logout = async (req: Request, res: Response) => {
    await deleteSession(res.locals.token);
    clearSessionCookies(res);
    return res.status(200).send();
};

const passwordSchema = z.object({
    oldPassword: z.string().max(1000).optional(),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH).max(1000),
});

// Users change their own password (with the old one); admins can set anyone's
export const setPassword = async (req: Request, res: Response) => {
    const userID = idParam(req, 'userID');
    const me = requireSelf(res, userID, 'ADMIN');
    const body = parseBody(passwordSchema, req.body);

    const user = await prisma.user.findUnique({ where: { ID: userID } });
    if (!user) {
        throw new HttpError(404, 'Uživatel nenalezen.');
    }
    if (me.ID === userID && !(await verifyPassword(body.oldPassword ?? '', user.PasswordHash, user.PasswordSalt))) {
        throw new HttpError(403, 'Nesprávné původní heslo.');
    }

    await prisma.user.update({
        where: { ID: user.ID },
        data: { PasswordHash: await hashPassword(body.newPassword), PasswordSalt: null },
    });
    // sign the account out everywhere else
    await deleteUserSessions(user.ID, me.ID === userID ? res.locals.token : undefined);
    return res.status(200).send();
};

// Who is signed in (lets the frontend check its session)
// The signed-in user; Demo: the public demo (DEMO_MODE), where uploads are off
export const me = (demoMode: boolean) => async (req: Request, res: Response) => {
    return res.status(200).send({ ...currentUser(res), Demo: demoMode });
};
