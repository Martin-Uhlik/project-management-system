import fs from 'node:fs';
import path from 'node:path';
import prisma from './client.ts';
import { seedDemoData } from './demoData.ts';
import { disconnectAll } from './live.ts';
import { dataDir } from './resources/tasks.ts';

// ---------------------------------------------------------------------------------------------------------------------
// The public demo (DEMO_MODE=true) goes back to its starting state every night: whatever visitors added, changed or
// deleted during the day is thrown away and the demo data is seeded again (with dates relative to the new day, so it
// stays current). The admin accounts are kept as they are, with their passwords; everyone is signed out.
//
// Settings:
//   DEMO_RESET_HOUR       the hour (0-23) to reset at, default 3; "off" = never (only with DEMO_MODE=true anyway)
//   DEMO_RESET_TIME_ZONE  the time zone of that hour, default Europe/Prague

// Empties the database and the uploaded files, then puts the admin accounts and the demo data back
export const resetDemoData = async () => {
    const admins = await prisma.user.findMany({
        where: { UserType: 'ADMIN', Deleted: false },
        select: { UserName: true, FirstName: true, LastName: true, PasswordHash: true, PasswordSalt: true, Enabled: true, Position: true },
        orderBy: { ID: 'asc' },
    });

    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    const names = tables.map((table) => `"public"."${table.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);

    // the folder itself may be a mounted volume: empty it, don't remove it
    const dir = dataDir();
    const entries = await fs.promises.readdir(dir).catch(() => [] as string[]);
    await Promise.all(entries.map((entry) => fs.promises.rm(path.join(dir, entry), { recursive: true, force: true })));

    for (const admin of admins) await prisma.user.create({ data: { ...admin, UserType: 'ADMIN' } });
    await seedDemoData();
    // the sessions are gone: open browsers go back to the sign-in page
    await disconnectAll();
};

// The hour and the date (YYYY-MM-DD) now in the time zone
const localNow = (timeZone: string, now: Date) => {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
            .formatToParts(now)
            .map((part) => [part.type, part.value]),
    );
    return { hour: Number(parts.hour), date: `${parts.year}-${parts.month}-${parts.day}` };
};

export type DemoResetSettings = { hour: number; timeZone: string };

export const demoResetSettingsFromEnv = (): DemoResetSettings | null => {
    const value = (process.env.DEMO_RESET_HOUR ?? '3').trim();
    if (value === 'off') return null;
    const hour = Number(value);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error(`DEMO_RESET_HOUR must be 0-23 or "off", not "${value}"`);
    const timeZone = process.env.DEMO_RESET_TIME_ZONE || 'Europe/Prague';
    // an unknown time zone throws here, at start, not in the middle of the night
    localNow(timeZone, new Date());
    return { hour, timeZone };
};

// Checks every minute whether the reset hour has come, and resets once a day (also right after a restart in that hour,
// if that day's reset hasn't run yet). Returns a function that stops it.
export const scheduleDemoReset = (settings: DemoResetSettings, reset = resetDemoData, now = () => new Date()) => {
    let lastDate: string | null = null;
    let running = false;
    const check = async () => {
        const local = localNow(settings.timeZone, now());
        if (local.hour !== settings.hour || local.date === lastDate || running) return;
        running = true;
        lastDate = local.date;
        try {
            await reset();
            console.log(`The demo data was reset (${local.date}).`);
        } catch (error) {
            console.error('Resetting the demo data failed:', error);
        } finally {
            running = false;
        }
    };
    const timer = setInterval(() => void check(), 60_000);
    timer.unref();
    void check();
    return () => clearInterval(timer);
};
