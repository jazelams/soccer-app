import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { checkAuth, unauthorized, forbidden } from '@/app/lib/api-utils';
import { z } from 'zod';

const updateTournamentSchema = z.object({
    name: z.string().optional(),
    startDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'FINISHED']).optional(),
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await checkAuth(request);
    if (!user) return unauthorized();

    try {
        const { id } = await params;
        const tournament = await prisma.tournament.findUnique({
            where: { id: Number(id) },
            include: {
                teams: {
                    orderBy: { name: 'asc' },
                    include: { payments: true }
                }
            }
        });

        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        return NextResponse.json(tournament);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching tournament details' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (user.role !== 'ADMIN') return forbidden();

    try {
        const { id } = await params;
        const body = await request.json();
        const data = updateTournamentSchema.parse(body);

        const tournament = await prisma.tournament.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                status: data.status as any
            }
        });

        return NextResponse.json(tournament);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating tournament' }, { status: 500 });
    }
}
