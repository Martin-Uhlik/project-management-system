// Fills an empty database, so you can sign in and the app has something to show.
// - the first admin account (ADMIN_LOGIN / ADMIN_PASSWORD, default admin / admin), when there are no users yet
// - with SEED_DEMO_DATA=true, example data (users, projects with task graphs, machines, material, requests,
//   personal tasks, worked time), when there are no projects yet
// Existing data is never changed, so it is safe to run on every start (the "migrate" service in docker compose does).
// Run by: npm run db:seed (on this machine), node dist/seed.js (in the production image)
import './env.ts';
import prisma from './client.ts';
import { hashPassword } from './auth.ts';
import { seedDemoData } from './demoData.ts';

const userCount = await prisma.user.count();
if (userCount === 0) {
    const login = process.env.ADMIN_LOGIN || 'admin';
    await prisma.user.create({
        data: {
            UserName: login,
            FirstName: 'Admin',
            LastName: 'Admin',
            PasswordHash: await hashPassword(process.env.ADMIN_PASSWORD || 'admin'),
            Enabled: true,
            Position: 'Administrátor',
            UserType: 'ADMIN',
        },
    });
    console.log(`Created the first admin account "${login}".`);
} else {
    console.log('The database already has users, no admin account created.');
}

if (process.env.SEED_DEMO_DATA === 'true') {
    if ((await prisma.project.count()) === 0) {
        await seedDemoData();
        console.log('Added the demo data (sign in as any demo user with the password "demo1234").');
    } else {
        console.log('The database already has projects, no demo data added.');
    }
}

await prisma.$disconnect();
