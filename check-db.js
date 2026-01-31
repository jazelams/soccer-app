const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany();
        console.log('Usuarios en la base de datos:', users.map(u => u.username));

        const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (admin) {
            console.log('✅ Usuario ADMIN existe.');
        } else {
            console.log('❌ Usuario ADMIN NO existe.');
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
