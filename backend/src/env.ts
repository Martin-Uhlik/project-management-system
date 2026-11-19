// Imported first by index.ts, so the settings are in place before any other module reads them.
// Settings come from the environment, or from .env on a dev machine.
try {
    process.loadEnvFile();
} catch {
    // no .env file: the environment already holds the settings (Docker)
}
