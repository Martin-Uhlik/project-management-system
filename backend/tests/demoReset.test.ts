import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { resetDemoData, scheduleDemoReset } from '../src/demoReset.ts';
import { createProject, createUser, prisma, resetDb } from './helpers.ts';

describe('resetDemoData', () => {
    beforeAll(async () => {
        await resetDb();
    });

    it('throws away what visitors did, keeps the admins and seeds the demo data again', async () => {
        const admin = await createUser('ADMIN', { UserName: 'boss' });
        const visitor = await createUser('MANAGER');
        await createProject(visitor.ID, []);
        const stray = path.join(process.env.DATA_DIR!, '999', 'uploaded-by-a-visitor.txt');
        await mkdir(path.dirname(stray), { recursive: true });
        await writeFile(stray, 'x');

        await resetDemoData();

        const kept = await prisma.user.findUniqueOrThrow({ where: { UserName: 'boss' } });
        expect(kept).toMatchObject({ UserType: 'ADMIN', PasswordHash: admin.PasswordHash, Enabled: true });
        expect(await prisma.user.findUnique({ where: { UserName: visitor.UserName } })).toBeNull();
        expect(await prisma.userSession.count()).toBe(0);
        // the demo data: 14 people + the disabled account, 8 projects, and their example files on disk
        expect(await prisma.user.count({ where: { UserType: { not: 'ADMIN' } } })).toBe(15);
        expect(await prisma.project.count()).toBe(8);
        expect(await readdir(process.env.DATA_DIR!)).not.toContain('999');
        expect((await readdir(process.env.DATA_DIR!)).length).toBeGreaterThan(1);
    }, 60000);
});

describe('scheduleDemoReset', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('resets once a day, in the hour set, in the time zone set', async () => {
        vi.useFakeTimers();
        // 2026-11-23 00:30 UTC = 01:30 in Prague
        let now = new Date('2026-11-23T00:30:00Z');
        const reset = vi.fn(async () => {});
        const stop = scheduleDemoReset({ hour: 3, timeZone: 'Europe/Prague' }, reset, () => now);

        await vi.advanceTimersByTimeAsync(60_000);
        expect(reset).not.toHaveBeenCalled();

        // 03:00 in Prague
        now = new Date('2026-11-23T02:00:00Z');
        await vi.advanceTimersByTimeAsync(60_000);
        expect(reset).toHaveBeenCalledTimes(1);

        // later in that hour: not again
        now = new Date('2026-11-23T02:45:00Z');
        await vi.advanceTimersByTimeAsync(60_000);
        expect(reset).toHaveBeenCalledTimes(1);

        // the next night
        now = new Date('2026-11-24T02:10:00Z');
        await vi.advanceTimersByTimeAsync(60_000);
        expect(reset).toHaveBeenCalledTimes(2);
        stop();
    });

    it('keeps going after a failed reset and tries again the next night', async () => {
        vi.useFakeTimers();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        let now = new Date('2026-11-23T02:00:00Z');
        const reset = vi.fn().mockRejectedValueOnce(new Error('database down')).mockResolvedValue(undefined);
        const stop = scheduleDemoReset({ hour: 3, timeZone: 'Europe/Prague' }, reset, () => now);
        await vi.advanceTimersByTimeAsync(0);
        expect(reset).toHaveBeenCalledTimes(1);
        now = new Date('2026-11-24T02:00:00Z');
        await vi.advanceTimersByTimeAsync(60_000);
        expect(reset).toHaveBeenCalledTimes(2);
        stop();
    });
});
