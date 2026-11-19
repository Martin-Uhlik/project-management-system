// Prisma CLI settings, used by: npx prisma generate / npm run db:push
import { defineConfig } from 'prisma/config';

// DATABASE_URL comes from the environment, or from .env on a dev machine
try {
    process.loadEnvFile();
} catch {
    // no .env file: the environment already holds DATABASE_URL
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: process.env.DATABASE_URL ?? '',
    },
});
