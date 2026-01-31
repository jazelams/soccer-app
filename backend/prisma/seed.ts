import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Seed Tournaments
    const days = [
        { name: 'Torneo Lunes', day: 'MONDAY' },
        { name: 'Torneo Martes', day: 'TUESDAY' },
        { name: 'Torneo Miércoles', day: 'WEDNESDAY' },
        { name: 'Torneo Jueves', day: 'THURSDAY' },
        { name: 'Torneo Viernes', day: 'FRIDAY' },
        { name: 'Torneo Sábado', day: 'SATURDAY' },
    ];

    console.log('Seeding Tournaments...');
    for (const t of days) {
        await prisma.tournament.upsert({
            where: { day: t.day as any },
            update: {},
            create: {
                name: t.name,
                day: t.day as any,
            },
        });
    }

    // 2. Seed Admin User
    console.log('Seeding Admin User...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            role: Role.ADMIN
        }
    });

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
