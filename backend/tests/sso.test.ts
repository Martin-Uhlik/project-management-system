import crypto from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SsoSettings } from '../src/sso.ts';
import { createUser, makeApp, ORIGIN, resetDb } from './helpers.ts';

// the sign-in handoff from martin-uhlik.cz and the demo accounts (sso.ts): tokens signed with a key pair made for the test
const ISSUER = 'https://martin-uhlik.cz';
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const settings: SsoSettings = {
    publicKey,
    issuer: ISSUER,
    audience: 'project-management-system',
    demoAccounts: { USER: 'demo-worker', MANAGER: 'demo-manager' },
};
const app = makeApp({ sso: settings });

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

// a token as personal-website makes it; claims and header can be overridden, key swapped
const makeToken = (claims: Record<string, unknown> = {}, header: Record<string, unknown> = { alg: 'EdDSA', typ: 'JWT' }, key = privateKey) => {
    const now = Math.floor(Date.now() / 1000);
    const body = { iss: ISSUER, aud: 'project-management-system', sub: '42', iat: now, exp: now + 60, jti: crypto.randomUUID(), ...claims };
    const signed = `${b64(header)}.${b64(body)}`;
    return `${signed}.${crypto.sign(null, Buffer.from(signed), key).toString('base64url')}`;
};

const handoff = (token: string, origin = ISSUER) => request(app).post('/sso').set('Origin', origin).type('form').send({ token });

// "name=value" pairs of the cookies a response sets, for the next request
const cookiesOf = (res: request.Response) =>
    ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).map((line) => line.split(';')[0]).join('; ');

// a browser that came through the handoff: it holds the demo pass
const withPass = async () => {
    const res = await handoff(makeToken());
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe(`${ORIGIN}/`);
    return cookiesOf(res);
};

beforeEach(async () => {
    await resetDb();
    await createUser('USER', { UserName: 'demo-worker' });
    await createUser('MANAGER', { UserName: 'demo-manager' });
});

describe('sign-in handoff', () => {
    it('gives a valid token a demo pass and opens the sign-in page, without signing in yet', async () => {
        const res = await handoff(makeToken());
        const cookies = (res.headers['set-cookie'] as unknown as string[]) ?? [];
        expect(cookies.some((line) => line.startsWith('demo_pass=') && line.includes('HttpOnly'))).toBe(true);
        expect(cookies.some((line) => line.startsWith('auth='))).toBe(false);
    });

    it('works only once per token', async () => {
        const token = makeToken();
        expect((await handoff(token)).headers.location).toBe(`${ORIGIN}/`);
        const again = await handoff(token);
        expect(again.headers.location).toBe(`${ORIGIN}/?sso=failed`);
        expect(again.headers['set-cookie']).toBeUndefined();
    });

    it('refuses bad tokens', async () => {
        const now = Math.floor(Date.now() / 1000);
        const { privateKey: otherKey } = crypto.generateKeyPairSync('ed25519');
        const bad = [
            'not-a-token',
            makeToken({}, { alg: 'EdDSA' }, otherKey), // someone else's key
            makeToken({}, { alg: 'none' }),
            makeToken({ aud: 'another-demo' }),
            makeToken({ iss: 'https://evil.example' }),
            makeToken({ iat: now - 600, exp: now - 540 }), // expired
            makeToken({ exp: now + 3600 }), // lives too long
            makeToken({ jti: undefined }),
            makeToken().slice(0, -4) + 'AAAA', // signature changed
        ];
        for (const token of bad) {
            const res = await handoff(token);
            expect(res.headers.location, token).toBe(`${ORIGIN}/?sso=failed`);
            expect(res.headers['set-cookie']).toBeUndefined();
        }
    });

    it('refuses a token posted from another site', async () => {
        expect((await handoff(makeToken(), 'https://evil.example')).status).toBe(403);
        // the issuer's www. address is the same site
        expect((await handoff(makeToken(), 'https://www.martin-uhlik.cz')).headers.location).toBe(`${ORIGIN}/`);
    });

    it("doesn't open other routes to the issuer's site", async () => {
        const res = await request(app).post('/login').set('Origin', ISSUER).send({ name: 'demo-worker', password: 'x' });
        expect(res.status).toBe(403);
    });

    it('is off without settings', async () => {
        const off = makeApp({ sso: null });
        expect((await request(off).post('/sso').type('form').send({ token: makeToken() })).status).toBe(404);
        expect((await request(off).get('/demo-accounts')).status).toBe(404);
        expect((await request(off).post('/demo-login').send({ role: 'USER' })).status).toBe(404);
    });
});

describe('demo accounts', () => {
    it('are offered only with a demo pass: the worker and the manager, never an admin', async () => {
        expect((await request(app).get('/demo-accounts')).status).toBe(403);
        expect((await request(app).get('/demo-accounts').set('Cookie', 'demo_pass=9999999999.forged')).status).toBe(403);

        const res = await request(app)
            .get('/demo-accounts')
            .set('Cookie', await withPass());
        expect(res.status).toBe(200);
        expect(res.body.map((account: { role: string }) => account.role)).toEqual(['USER', 'MANAGER']);
        expect(res.body[0]).toMatchObject({ name: 'Test USER', position: 'Tester' });
    });

    it('sign in as the chosen role with a demo pass', async () => {
        const pass = await withPass();
        for (const [role, userName] of [
            ['USER', 'demo-worker'],
            ['MANAGER', 'demo-manager'],
        ]) {
            const res = await request(app).post('/demo-login').set('Cookie', pass).set('Origin', ORIGIN).send({ role });
            expect(res.status).toBe(200);
            const me = await request(app).get('/auth/me').set('Cookie', cookiesOf(res));
            expect(me.status).toBe(200);
            const expected = await request(app).get('/auth/users').set('Cookie', cookiesOf(res));
            const user = expected.body.find((candidate: { UserName: string }) => candidate.UserName === userName);
            expect(me.body.ID).toBe(user.ID);
        }
    });

    it("can't be used without a pass, or for an admin", async () => {
        expect((await request(app).post('/demo-login').send({ role: 'USER' })).status).toBe(403);
        const pass = await withPass();
        expect((await request(app).post('/demo-login').set('Cookie', pass).send({ role: 'ADMIN' })).status).toBe(400);
    });

    it("leave out a demo account that doesn't exist or is disabled", async () => {
        await resetDb();
        await createUser('USER', { UserName: 'demo-worker', Enabled: false });
        await createUser('MANAGER', { UserName: 'demo-manager' });
        const pass = await withPass();
        const res = await request(app).get('/demo-accounts').set('Cookie', pass);
        expect(res.body.map((account: { role: string }) => account.role)).toEqual(['MANAGER']);
        expect((await request(app).post('/demo-login').set('Cookie', pass).send({ role: 'USER' })).status).toBe(404);
    });
});
