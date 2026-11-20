import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import prisma from '../src/client.ts';
import { hashPassword } from '../src/auth.ts';
import { createApp, type AppOptions } from '../src/app.ts';
import type { UserType } from '../src/generated/prisma/client.ts';

export { prisma };

// uploaded files go to a temporary folder
process.env.DATA_DIR = path.join(os.tmpdir(), `pms-test-data-${process.pid}`);

export const ORIGIN = 'http://localhost:3000';
export const PASSWORD = 'correct horse battery';

export const makeApp = (options?: AppOptions) => createApp(options);

// Empties every table (between tests)
export const resetDb = async () => {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    const names = tables.map((table) => `"public"."${table.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
};

let userCounter = 0;
export const createUser = async (UserType: UserType, overrides: { UserName?: string; Enabled?: boolean } = {}) => {
    userCounter += 1;
    return prisma.user.create({
        data: {
            UserName: overrides.UserName ?? `${UserType.toLowerCase()}${userCounter}`,
            FirstName: 'Test',
            LastName: UserType,
            PasswordHash: await hashPassword(PASSWORD),
            Enabled: overrides.Enabled ?? true,
            Position: 'Tester',
            UserType,
        },
    });
};

// A supertest agent signed in as the user: it keeps the session cookie, like a browser
export const loginAs = async (app: ReturnType<typeof makeApp>, user: { UserName: string }) => {
    const agent = request.agent(app);
    const res = await agent.post('/login').set('Origin', ORIGIN).send({ name: user.UserName, password: PASSWORD });
    if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
    return agent;
};

// Signed-in agents for one user of each role
export const signInAll = async (app: ReturnType<typeof makeApp>) => {
    const admin = await createUser('ADMIN');
    const manager = await createUser('MANAGER');
    const user = await createUser('USER');
    const other = await createUser('USER');
    return {
        admin: { user: admin, agent: await loginAs(app, admin) },
        manager: { user: manager, agent: await loginAs(app, manager) },
        user: { user: user, agent: await loginAs(app, user) },
        other: { user: other, agent: await loginAs(app, other) },
    };
};

export const createProject = (OwnerID: number, memberIDs: number[] = []) =>
    prisma.project.create({
        data: {
            Name: 'Project',
            Finished: false,
            OwnerID,
            Member: { create: memberIDs.map((UserID) => ({ UserID })) },
        },
    });

export const createTask = (ProjectID: number, OwnerID: number, assigneeIDs: number[] = []) =>
    prisma.task.create({
        data: {
            Name: 'Task',
            FinishDate: new Date(),
            Finished: false,
            XPosition: 0,
            YPosition: 0,
            Size: 10,
            OwnerID,
            ProjectID,
            User_Task: { create: assigneeIDs.map((UserID) => ({ UserID })) },
        },
    });
