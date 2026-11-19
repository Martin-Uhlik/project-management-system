// Fills an empty database: creates the first admin account when there are no users yet, so you can sign in.
// Run by: npm run db:seed (docker-compose.dev.yml runs it on every start). Existing data is left alone.
// The account comes from ADMIN_LOGIN / ADMIN_PASSWORD (defaults admin / admin, meant for a dev database only).
import '../src/env.ts';
import prisma from '../src/client.ts';
import { calculateHash, calculateSalt } from '../src/auth.ts';

const userCount = await prisma.user.count();
if (userCount === 0) {
    const login = process.env.ADMIN_LOGIN || 'admin';
    const salt = calculateSalt();
    await prisma.user.create({
        data: {
            UserName: login,
            FirstName: 'Admin',
            LastName: 'Admin',
            PasswordHash: calculateHash(process.env.ADMIN_PASSWORD || 'admin', salt),
            PasswordSalt: salt,
            Enabled: true,
            Position: 'Administrátor',
            UserType: 'ADMIN',
        },
    });
    console.log(`Created the first admin account "${login}".`);
} else {
    console.log('The database already has users, nothing to seed.');
}
await prisma.$disconnect();
