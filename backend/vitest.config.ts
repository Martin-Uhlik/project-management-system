import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/testDatabase.ts';

// API tests run against a real PostgreSQL database: TEST_DATABASE_URL, or DATABASE_URL with "_test" added to the
// database name (e.g. .../pms_test). tests/globalSetup.ts creates it and applies the migrations to it before each run.
export default defineConfig({
    test: {
        environment: 'node',
        globalSetup: './tests/globalSetup.ts',
        env: { DATABASE_URL: testDatabaseUrl(), FRONTEND_ORIGIN: 'http://localhost:3000' },
        // the test files share one database
        fileParallelism: false,
        testTimeout: 20000,
        hookTimeout: 60000,
    },
});
