import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { checkAuth, unauthorized, forbidden } from '../../lib/api-utils';
import { z } from 'zod';

const tournamentSchema = z.object({
    name: z.string(),
    day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startDate: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const user = await checkAuth(request);
    if (!user) return unauthorized();

    try {
        const tournaments = await prisma.tournament.findMany({
            orderBy: { id: 'asc' },
            include: {
                _count: {
                    select: { teams: true }
                }
            }
        });
        return NextResponse.json(tournaments);
    } catch (error: any) {
        console.error('Fetch tournaments error:', error);
        return NextResponse.json({
            error: 'Error fetching tournaments',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    try {
        const body = await request.json();
        const data = tournamentSchema.parse(body);

        const tournament = await prisma.tournament.create({
            data: {
                name: data.name,
                day: data.day as any,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                status: 'ACTIVE'
            }
        });

        return NextResponse.json(tournament, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error creating tournament' }, { status: 500 });
    }
}
