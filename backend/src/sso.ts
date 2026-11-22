import crypto, { type KeyObject } from 'node:crypto';
import type { Request, Response } from 'express';
import { cookieOptions, createSession, readCookie, setSessionCookies } from './auth.ts';
import prisma from './client.ts';

// ---------------------------------------------------------------------------------------------------------------------
// Sign-in handoff from martin-uhlik.cz (personal-website) to the public demo.
//
// A visitor signed in on martin-uhlik.cz clicks "Demo app"; that site signs a short JWT (Ed25519, "EdDSA") saying
// "this visitor may open the demo" and has the browser POST it here as the form field "token". When it checks out,
// the browser gets a demo pass (an httpOnly cookie for DEMO_PASS_MINUTES) and lands on the sign-in page, which then
// offers the demo accounts: one click signs in as the worker or the manager (POST /demo-login). The password form
// stays there too (e.g. for your own admin account). Without a pass the sign-in page has only the password form.
// The other site holds the private key; this one only the public key (SSO_PUBLIC_KEY), so it can check tokens but
// never make them.
//
// Settings (all unset = the handoff is off and POST /sso answers 404):
//   SSO_PUBLIC_KEY     the issuer's Ed25519 public key: base64 of the DER (SPKI) form, one line
//   SSO_ISSUER         who signs the tokens (the "iss" claim), e.g. https://martin-uhlik.cz; its form may be posted
//                      from there or from its www. address
//   SSO_AUDIENCE       this app in the "aud" claim, default its address (the first FRONTEND_ORIGIN)
//   SSO_DEMO_WORKER    the demo account for the worker role, default tsvoboda (see demoData.ts)
//   SSO_DEMO_MANAGER   the demo account for the manager role, default jnovak

const MAX_LIFETIME_S = 120;
const CLOCK_SKEW_S = 30;
const DEMO_PASS_MINUTES = 30;
const DEMO_PASS_COOKIE = 'demo_pass';

// the roles the demo offers, by the user type they sign in as
export type DemoRole = 'USER' | 'MANAGER';
const DEMO_ROLES: DemoRole[] = ['USER', 'MANAGER'];

export type SsoSettings = { publicKey: KeyObject; issuer: string; audience: string; demoAccounts: Record<DemoRole, string> };

// the pages the issuer's form may be posted from (the Origin header of POST /sso)
export const formOrigins = (settings: SsoSettings) => [settings.issuer, settings.issuer.replace('://', '://www.')];

export const ssoSettingsFromEnv = (defaultAudience: string): SsoSettings | null => {
    const key = process.env.SSO_PUBLIC_KEY?.trim();
    const issuer = process.env.SSO_ISSUER?.trim().replace(/\/$/, '');
    if (!key || !issuer) return null;
    return {
        publicKey: crypto.createPublicKey({ key: Buffer.from(key, 'base64'), format: 'der', type: 'spki' }),
        issuer,
        audience: process.env.SSO_AUDIENCE?.trim() || defaultAudience,
        demoAccounts: {
            USER: process.env.SSO_DEMO_WORKER?.trim() || 'tsvoboda',
            MANAGER: process.env.SSO_DEMO_MANAGER?.trim() || 'jnovak',
        },
    };
};

type Claims = { iss?: unknown; aud?: unknown; sub?: unknown; iat?: unknown; exp?: unknown; jti?: unknown };

const decodePart = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;

// The token's claims when it is a valid, unexpired token of the issuer for this app; null otherwise
export const verifyHandoffToken = (token: string, settings: SsoSettings, now = Date.now() / 1000): Claims | null => {
    const parts = token.split('.');
    if (parts.length !== 3 || token.length > 4096) return null;
    try {
        const header = decodePart(parts[0]);
        if (header.alg !== 'EdDSA') return null;
        const signatureOk = crypto.verify(null, Buffer.from(`${parts[0]}.${parts[1]}`), settings.publicKey, Buffer.from(parts[2], 'base64url'));
        if (!signatureOk) return null;
        const claims = decodePart(parts[1]) as Claims;
        if (claims.iss !== settings.issuer || claims.aud !== settings.audience) return null;
        if (typeof claims.exp !== 'number' || typeof claims.iat !== 'number' || typeof claims.jti !== 'string' || !claims.jti) return null;
        if (claims.exp < now - CLOCK_SKEW_S || claims.iat > now + CLOCK_SKEW_S || claims.exp - claims.iat > MAX_LIFETIME_S) return null;
        return claims;
    } catch {
        return null;
    }
};

// Each token works once: the ids of used tokens, kept until they would have expired anyway. In memory, as there is
// one backend process; after a restart a token from the last two minutes could be used again, which only signs that
// browser in once more as the same demo account.
const createReplayGuard = () => {
    const used = new Map<string, number>();
    return (jti: string, exp: number, now = Date.now() / 1000) => {
        for (const [id, expires] of used) if (expires + CLOCK_SKEW_S < now) used.delete(id);
        if (used.has(jti)) return false;
        used.set(jti, exp);
        return true;
    };
};

// The demo pass: "<expiry in s>.<HMAC of it>", signed with a key made at start (one backend process). A restart
// ends all passes; the visitor then opens the demo again from martin-uhlik.cz.
const createDemoPasses = () => {
    const key = crypto.randomBytes(32);
    const mac = (expires: string) => crypto.createHmac('sha256', key).update(`demo-pass.${expires}`).digest('base64url');
    return {
        issue: (now = Date.now()) => {
            const expires = String(Math.floor(now / 1000) + DEMO_PASS_MINUTES * 60);
            return { value: `${expires}.${mac(expires)}`, maxAge: DEMO_PASS_MINUTES * 60 * 1000 };
        },
        valid: (value: string | undefined, now = Date.now()) => {
            const [expires, signature] = (value ?? '').split('.');
            if (!expires || !signature || Number(expires) * 1000 < now) return false;
            const expected = Buffer.from(mac(expires));
            const actual = Buffer.from(signature);
            return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
        },
    };
};

const notFound = (res: Response) => res.status(404).send({ errorMessage: 'Chybná adresa zdroje.' });

// The routes of the handoff (all answer 404 while it is off):
//   POST /sso            the form field "token" (application/x-www-form-urlencoded, the issuer's auto-submitted form)
//   GET  /demo-accounts  the demo accounts to offer, with a valid demo pass; 403 without
//   POST /demo-login     { role: 'USER' | 'MANAGER' } with a valid demo pass: signs in as that demo account
export const ssoRoutes = (settings: SsoSettings | null, appOrigin: string) => {
    const firstUse = createReplayGuard();
    const passes = createDemoPasses();
    const hasPass = (req: Request) => passes.valid(readCookie(req.headers, DEMO_PASS_COOKIE));

    const handoff = async (req: Request, res: Response) => {
        if (!settings) return notFound(res);
        const token = typeof req.body?.token === 'string' ? req.body.token : '';
        const claims = verifyHandoffToken(token, settings);
        if (!claims || !firstUse(claims.jti as string, claims.exp as number)) {
            // the sign-in page says the link didn't work
            return res.redirect(303, `${appOrigin}/?sso=failed`);
        }
        const pass = passes.issue();
        res.cookie(DEMO_PASS_COOKIE, pass.value, { ...cookieOptions(), httpOnly: true, maxAge: pass.maxAge });
        return res.redirect(303, `${appOrigin}/`);
    };

    const accounts = async (req: Request, res: Response) => {
        if (!settings) return notFound(res);
        if (!hasPass(req)) return res.status(403).send({ errorMessage: 'Demo účty jsou dostupné jen z martin-uhlik.cz.' });
        const users = await prisma.user.findMany({
            where: { UserName: { in: Object.values(settings.demoAccounts) }, Enabled: true, Deleted: false },
            select: { UserName: true, FirstName: true, LastName: true, Position: true },
        });
        const offered = DEMO_ROLES.flatMap((role) => {
            const user = users.find((candidate) => candidate.UserName === settings.demoAccounts[role]);
            return user ? [{ role, name: `${user.FirstName} ${user.LastName}`, position: user.Position }] : [];
        });
        return res.status(200).send(offered);
    };

    const login = async (req: Request, res: Response) => {
        if (!settings) return notFound(res);
        if (!hasPass(req)) return res.status(403).send({ errorMessage: 'Platnost demo přístupu vypršela. Otevřete demo znovu z martin-uhlik.cz.' });
        const role = req.body?.role;
        if (!DEMO_ROLES.includes(role)) return res.status(400).send({ errorMessage: 'Neznámá role.' });
        const user = await prisma.user.findUnique({ where: { UserName: settings.demoAccounts[role as DemoRole] } });
        if (!user || !user.Enabled || user.Deleted) return res.status(404).send({ errorMessage: 'Demo účet není k dispozici.' });
        const { token, expires } = await createSession(user.ID);
        setSessionCookies(res, token, expires, user.ID);
        return res.status(200).send({ userId: user.ID, expires });
    };

    return { handoff, accounts, login };
};
