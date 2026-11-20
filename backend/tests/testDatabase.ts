// Which database the API tests use (never the one in DATABASE_URL itself, because the tests wipe it)
export const testDatabaseUrl = () => {
    try {
        // (vitest runs from backend/, and bundles its config elsewhere, so the path is relative to the working directory)
        process.loadEnvFile('../.env');
    } catch {
        // no .env file: the environment holds the settings
    }
    if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
    const base = process.env.DATABASE_URL;
    if (!base) throw new Error('Set TEST_DATABASE_URL (or DATABASE_URL) to run the API tests.');
    const url = new URL(base);
    url.pathname = `${url.pathname.replace(/\/$/, '')}_test`;
    return url.toString();
};
