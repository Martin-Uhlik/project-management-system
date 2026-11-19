// Prisma CLI settings, used by: npx prisma generate / npm run db:push / npm run db:seed
import { defineConfig } from 'prisma/config';

// DATABASE_URL comes from the environment, or from the .env in the repository root on a dev machine
try {
    process.loadEnvFile('../.env');
} catch {
    // no .env file: the environment already holds DATABASE_URL
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL ?? '',
    },
});
