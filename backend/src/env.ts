// Imported first by index.ts, so the settings are in place before any other module reads them.
// Settings come from the environment (Docker), or from the .env in the repository root on a dev machine.
// Values already in the environment win over the file.
try {
    process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch {
    // no .env file: the environment already holds the settings (Docker)
}
