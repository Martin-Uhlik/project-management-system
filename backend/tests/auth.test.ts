import crypto from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createUser, loginAs, makeApp, ORIGIN, PASSWORD, prisma, resetDb } from './helpers.ts';

const app = makeApp();

beforeEach(resetDb);

const cookies = (res: request.Response) => ([] as string[]).concat(res.headers['set-cookie'] ?? []);

describe('sign-in', () => {
    it('sets an httpOnly session cookie and a readable user_id cookie', async () => {
        const user = await createUser('USER');
        const res = await request(app).post('/login').send({ name: user.UserName, password: PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.userId).toBe(user.ID);
        const auth = cookies(res).find((cookie) => cookie.startsWith('auth='));
        const userId = cookies(res).find((cookie) => cookie.startsWith('user_id='));
        expect(auth).toMatch(/HttpOnly/i);
        expect(auth).toMatch(/SameSite=Lax/i);
        expect(auth).toMatch(/Expires=/i);
        expect(userId).toBe(`user_id=${user.ID}; Path=/; Expires=${userId?.match(/Expires=([^;]+)/)?.[1]}; SameSite=Lax`);
        // the token is not in the response body
        expect(JSON.stringify(res.body)).not.toContain(auth!.split(';')[0].slice('auth='.length));
    });

    it('stores only a hash of the session token', async () => {
        const user = await createUser('USER');
        const res = await request(app).post('/login').send({ name: user.UserName, password: PASSWORD });
        const token = cookies(res)
            .find((cookie) => cookie.startsWith('auth='))!
            .split(';')[0]
            .slice('auth='.length);
        const sessions = await prisma.userSession.findMany();
        expect(sessions).toHaveLength(1);
        expect(sessions[0].Token).not.toBe(token);
        expect(sessions[0].Token).toBe(crypto.createHash('sha256').update(token).digest('hex'));
    });

    it('refuses a wrong password and an unknown user the same way', async () => {
        const user = await createUser('USER');
        const wrong = await request(app).post('/login').send({ name: user.UserName, password: 'nope' });
        const unknown = await request(app).post('/login').send({ name: 'nobody', password: 'nope' });
        expect(wrong.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(wrong.body).toEqual(unknown.body);
        expect(cookies(wrong)).toHaveLength(0);
    });

    it('refuses a disabled account', async () => {
        const user = await createUser('USER', { Enabled: false });
        const res = await request(app).post('/login').send({ name: user.UserName, password: PASSWORD });
        expect(res.status).toBe(403);
    });

    it('refuses a malformed body with 400', async () => {
        const res = await request(app)
            .post('/login')
            .send({ name: { not: 'a string' }, password: 1 });
        expect(res.status).toBe(400);
    });

    it('upgrades an old SHA-256 password to scrypt on sign-in', async () => {
        const salt = crypto.randomUUID();
        const legacy = crypto
            .createHash('sha256')
            .update(PASSWORD + salt)
            .digest('hex');
        const user = await prisma.user.create({
            data: {
                UserName: 'legacy',
                FirstName: 'L',
                LastName: 'L',
                PasswordHash: legacy,
                PasswordSalt: salt,
                Enabled: true,
                Position: '',
                UserType: 'USER',
            },
        });

        const wrong = await request(app).post('/login').send({ name: 'legacy', password: 'wrong' });
        expect(wrong.status).toBe(401);
        expect((await prisma.user.findUniqueOrThrow({ where: { ID: user.ID } })).PasswordHash).toBe(legacy);

        const res = await request(app).post('/login').send({ name: 'legacy', password: PASSWORD });
        expect(res.status).toBe(200);
        const upgraded = await prisma.user.findUniqueOrThrow({ where: { ID: user.ID } });
        expect(upgraded.PasswordHash).toMatch(/^scrypt\$/);
        expect(upgraded.PasswordSalt).toBeNull();

        // and the new hash works
        const again = await request(app).post('/login').send({ name: 'legacy', password: PASSWORD });
        expect(again.status).toBe(200);
    });
});

describe('login rate limit', () => {
    it('blocks a user name after too many failures, and an IP after more', async () => {
        const limited = makeApp({ loginLimits: { windowMs: 60_000, maxFailuresPerName: 3, maxFailuresPerIp: 5 } });
        const user = await createUser('USER');
        for (let i = 0; i < 3; i++) {
            expect((await request(limited).post('/login').send({ name: user.UserName, password: 'wrong' })).status).toBe(401);
        }
        // even the right password is refused now
        const blocked = await request(limited).post('/login').send({ name: user.UserName, password: PASSWORD });
        expect(blocked.status).toBe(429);
        expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);

        // other names still work from this IP until the IP limit
        const other = await createUser('USER');
        expect((await request(limited).post('/login').send({ name: other.UserName, password: PASSWORD })).status).toBe(200);
        for (let i = 0; i < 2; i++) {
            await request(limited)
                .post('/login')
                .send({ name: `guess${i}`, password: 'wrong' });
        }
        expect((await request(limited).post('/login').send({ name: other.UserName, password: PASSWORD })).status).toBe(429);
    });

    it('a successful sign-in resets the user name count', async () => {
        const limited = makeApp({ loginLimits: { windowMs: 60_000, maxFailuresPerName: 3, maxFailuresPerIp: 100 } });
        const user = await createUser('USER');
        for (let round = 0; round < 3; round++) {
            for (let i = 0; i < 2; i++) await request(limited).post('/login').send({ name: user.UserName, password: 'wrong' });
            expect((await request(limited).post('/login').send({ name: user.UserName, password: PASSWORD })).status).toBe(200);
        }
    });
});

describe('sessions', () => {
    it('requires a session for everything under /auth', async () => {
        const res = await request(app).get('/auth/projects');
        expect(res.status).toBe(401);
        const bogus = await request(app).get('/auth/projects').set('Cookie', 'auth=made-up');
        expect(bogus.status).toBe(401);
    });

    it('accepts the cookie, and a Bearer token for scripts', async () => {
        const user = await createUser('USER');
        const agent = await loginAs(app, user);
        expect((await agent.get('/auth/me')).body).toEqual({ ID: user.ID, UserType: 'USER' });

        const res = await request(app).post('/login').send({ name: user.UserName, password: PASSWORD });
        const token = cookies(res)
            .find((cookie) => cookie.startsWith('auth='))!
            .split(';')[0]
            .slice('auth='.length);
        expect((await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    });

    it('ends when it expires', async () => {
        const user = await createUser('USER');
        const agent = await loginAs(app, user);
        expect((await agent.get('/auth/me')).status).toBe(200);
        await prisma.userSession.updateMany({ data: { Expires: new Date(Date.now() - 1000) } });
        expect((await agent.get('/auth/me')).status).toBe(401);
        expect(await prisma.userSession.count()).toBe(0);
    });

    it('ends when the account is disabled', async () => {
        const user = await createUser('USER');
        const agent = await loginAs(app, user);
        await prisma.user.update({ where: { ID: user.ID }, data: { Enabled: false } });
        expect((await agent.get('/auth/me')).status).toBe(401);
    });

    it('ends on logout, which also clears the cookies', async () => {
        const user = await createUser('USER');
        const agent = await loginAs(app, user);
        const res = await agent.post('/auth/logout').set('Origin', ORIGIN);
        expect(res.status).toBe(200);
        expect(cookies(res).some((cookie) => /^auth=;/.test(cookie))).toBe(true);
        expect(await prisma.userSession.count()).toBe(0);
        expect((await agent.get('/auth/me')).status).toBe(401);
    });
});

describe('password change', () => {
    it('needs the old password, and signs out the other sessions', async () => {
        const user = await createUser('USER');
        const agent = await loginAs(app, user);
        const otherDevice = await loginAs(app, user);

        const wrong = await agent.patch(`/auth/users/password/${user.ID}`).send({ oldPassword: 'wrong', newPassword: 'a new password' });
        expect(wrong.status).toBe(403);
        const short = await agent.patch(`/auth/users/password/${user.ID}`).send({ oldPassword: PASSWORD, newPassword: 'short' });
        expect(short.status).toBe(400);

        const ok = await agent.patch(`/auth/users/password/${user.ID}`).send({ oldPassword: PASSWORD, newPassword: 'a new password' });
        expect(ok.status).toBe(200);
        expect((await agent.get('/auth/me')).status).toBe(200);
        expect((await otherDevice.get('/auth/me')).status).toBe(401);
        expect((await request(app).post('/login').send({ name: user.UserName, password: 'a new password' })).status).toBe(200);
    });

    it("can't be done for someone else, except by an admin", async () => {
        const user = await createUser('USER');
        const victim = await createUser('USER');
        const admin = await createUser('ADMIN');
        const agent = await loginAs(app, user);
        expect((await agent.patch(`/auth/users/password/${victim.ID}`).send({ oldPassword: PASSWORD, newPassword: 'hijacked!!' })).status).toBe(403);

        const adminAgent = await loginAs(app, admin);
        expect((await adminAgent.patch(`/auth/users/password/${victim.ID}`).send({ newPassword: 'reset by admin' })).status).toBe(200);
        expect((await request(app).post('/login').send({ name: victim.UserName, password: 'reset by admin' })).status).toBe(200);
    });
});

describe('origins', () => {
    it('answers CORS only for the frontend origin, with credentials', async () => {
        const allowed = await request(app).options('/login').set('Origin', ORIGIN).set('Access-Control-Request-Method', 'POST');
        expect(allowed.headers['access-control-allow-origin']).toBe(ORIGIN);
        expect(allowed.headers['access-control-allow-credentials']).toBe('true');
        const other = await request(app).options('/login').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'POST');
        expect(other.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('refuses requests that change data from another origin', async () => {
        const user = await createUser('USER');
        const res = await request(app).post('/login').set('Origin', 'https://evil.example').send({ name: user.UserName, password: PASSWORD });
        expect(res.status).toBe(403);
        const agent = await loginAs(app, user);
        expect((await agent.post('/auth/logout').set('Origin', 'https://evil.example')).status).toBe(403);
    });
});
