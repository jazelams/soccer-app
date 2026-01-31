import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
        }

        const token = generateToken({ id: user.id, username: user.username, role: user.role });

        return NextResponse.json({
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error: any) {
        console.error('Login error full:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
