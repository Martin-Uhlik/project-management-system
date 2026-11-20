import crypto from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';
import prisma from './client.ts';
import { forbidden, unauthorized } from './errors.ts';
import type { UserType } from './generated/prisma/client.ts';

// ---------------------------------------------------------------------------------------------------------------------
// Passwords: scrypt, stored as "scrypt$N$r$p$salt$hash" (base64). Accounts made before this kept a single salted SHA-256
// (PasswordHash + PasswordSalt); they still sign in, and their hash is upgraded to scrypt on that sign-in.

const scrypt = promisify(crypto.scrypt) as (password: string, salt: Buffer, keylen: number, options: crypto.ScryptOptions) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export const hashPassword = async (password: string) => {
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
    return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
};

const legacyHash = (password: string, salt: string) => {
    return crypto
        .createHash('sha256')
        .update(password + salt)
        .digest('hex');
};

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && crypto.timingSafeEqual(a, b);

export const isLegacyHash = (stored: string) => !stored.startsWith('scrypt$');

// Checks a password against what the database holds (a scrypt string, or a legacy SHA-256 hash with its salt)
export const verifyPassword = async (password: string, stored: string, legacySalt?: string | null) => {
    if (isLegacyHash(stored)) {
        if (legacySalt == null) return false;
        return safeEqual(Buffer.from(legacyHash(password, legacySalt)), Buffer.from(stored));
    }
    const [, N, r, p, salt, hash] = stored.split('$');
    const expected = Buffer.from(hash, 'base64');
    const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
    return safeEqual(actual, expected);
};

// Used when the user name doesn't exist, so a failed sign-in takes as long either way
const DUMMY_HASH = await hashPassword(crypto.randomUUID());
export const burnPasswordCheck = (password: string) => verifyPassword(password, DUMMY_HASH);

export const MIN_PASSWORD_LENGTH = 8;

// ---------------------------------------------------------------------------------------------------------------------
// Sessions: a random token in an httpOnly cookie; the database keeps only its SHA-256, with an expiry.

export const SESSION_LIFETIME_MS = 20 * 60 * 60 * 1000;
export const AUTH_COOKIE = 'auth';
// Not secret: lets the frontend know who is signed in (the server never trusts it)
export const USER_ID_COOKIE = 'user_id';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const createSession = async (userID: number) => {
    const token = crypto.randomBytes(32).toString('base64url');
    const expires = new Date(Date.now() + SESSION_LIFETIME_MS);
    await prisma.userSession.create({
        data: { Token: hashToken(token), Expires: expires, UserID: userID },
    });
    // a good moment to drop sessions that ran out
    await prisma.userSession.deleteMany({ where: { Expires: { lt: new Date() } } });
    return { token, expires };
};

export const deleteSession = async (token: string) => {
    await prisma.userSession.deleteMany({ where: { Token: hashToken(token) } });
};

// Signs the user out everywhere, except (optionally) the session making the request
export const deleteUserSessions = async (userID: number, keepToken?: string) => {
    await prisma.userSession.deleteMany({
        where: { UserID: userID, ...(keepToken ? { NOT: { Token: hashToken(keepToken) } } : {}) },
    });
};

// Cookies are SameSite=Lax: other sites can't send them with their requests (no CSRF), and the frontend works as
// long as it is opened on the same host name as VITE_BACKEND. COOKIE_SECURE=true adds Secure (needs HTTPS).
const cookieOptions = () => ({
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.COOKIE_SECURE === 'true',
});

export const setSessionCookies = (res: Response, token: string, expires: Date, userID: number) => {
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), expires, httpOnly: true });
    res.cookie(USER_ID_COOKIE, String(userID), { ...cookieOptions(), expires });
};

export const clearSessionCookies = (res: Response) => {
    res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), httpOnly: true });
    res.clearCookie(USER_ID_COOKIE, cookieOptions());
};

const readCookie = (headers: IncomingHttpHeaders, name: string) => {
    const header = headers.cookie;
    if (!header) return undefined;
    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index !== -1 && part.slice(0, index).trim() === name) {
            try {
                return decodeURIComponent(part.slice(index + 1).trim());
            } catch {
                return undefined;
            }
        }
    }
    return undefined;
};

// The session token: the httpOnly cookie (the frontend), or "Authorization: Bearer <token>" (scripts and tests)
// (also the live updates connection, see live.ts, which only has the headers)
export const getTokenFromHeaders = (headers: IncomingHttpHeaders) => {
    const header = headers.authorization;
    if (header?.startsWith('Bearer ')) {
        return header.slice('Bearer '.length).trim();
    }
    return readCookie(headers, AUTH_COOKIE) ?? '';
};

export const getToken = (req: Request) => getTokenFromHeaders(req.headers);

// ---------------------------------------------------------------------------------------------------------------------
// Request guards

export type SessionUser = { ID: number; UserType: UserType };

// The user of a valid, unexpired session of an enabled user, with when the session ends; null otherwise
export const findSessionUser = async (token: string): Promise<{ user: SessionUser; expires: Date } | null> => {
    if (!token) return null;
    const session = await prisma.userSession.findUnique({
        where: { Token: hashToken(token) },
        include: { User: { select: { ID: true, UserType: true, Enabled: true, Deleted: true } } },
    });
    if (!session) return null;
    if (session.Expires.getTime() <= Date.now()) {
        await prisma.userSession.deleteMany({ where: { ID: session.ID } });
        return null;
    }
    if (!session.User.Enabled || session.User.Deleted) return null;
    return { user: { ID: session.User.ID, UserType: session.User.UserType }, expires: session.Expires };
};

// Middleware for everything under /auth: a valid, unexpired session of an enabled user, or 401
export const requireSession = async (req: Request, res: Response, next: NextFunction) => {
    const token = getToken(req);
    const session = await findSessionUser(token);
    if (!session) throw unauthorized();
    res.locals.user = session.user;
    res.locals.token = token;
    next();
};

// The signed-in user (set by requireSession)
export const currentUser = (res: Response): SessionUser => {
    const user = res.locals.user as SessionUser | undefined;
    if (!user) throw unauthorized();
    return user;
};

export const hasRole = (user: SessionUser, ...roles: UserType[]) => roles.includes(user.UserType);

export const isManager = (user: SessionUser) => hasRole(user, 'ADMIN', 'MANAGER');

// Middleware: only these roles may call the route
export const requireRole =
    (...roles: UserType[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!hasRole(currentUser(res), ...roles)) throw forbidden();
        next();
    };

// Throws 403 unless the route's user ID is the signed-in user (or the user has one of the given roles)
export const requireSelf = (res: Response, userID: number, ...rolesAllowedForOthers: UserType[]) => {
    const user = currentUser(res);
    if (user.ID !== userID && !hasRole(user, ...rolesAllowedForOthers)) throw forbidden();
    return user;
};
