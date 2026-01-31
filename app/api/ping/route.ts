import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        return NextResponse.json({ status: 'ok', message: 'API and Database connected', users: userCount });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
