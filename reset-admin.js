const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { password: hashedPassword },
            create: {
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN'
            }
        });
        console.log('✅ Password de admin reseteado a: admin123');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
