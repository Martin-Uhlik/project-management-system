import { execFileSync } from 'node:child_process';
import { testDatabaseUrl } from './testDatabase.ts';

// Creates the test database if needed and applies the migrations to it, once per test run (each test then empties
// the tables it uses, see resetDb in helpers.ts)
export default function setup() {
    const url = testDatabaseUrl();
    if (url === process.env.DATABASE_URL) {
        throw new Error('TEST_DATABASE_URL must not be the DATABASE_URL database: the tests wipe it.');
    }
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
        env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
        stdio: 'pipe',
    });
}
