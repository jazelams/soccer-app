import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { checkAuth, unauthorized, forbidden } from '@/app/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'TREASURER'].includes(user.role)) return forbidden();

    try {
        const { id } = await params;
        const teamId = Number(id);
        const { matchday, status } = await request.json();

        if (!matchday || !status) {
            return NextResponse.json({ error: 'Matchday and status required' }, { status: 400 });
        }

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const currentStatuses = (team.matchdayStatuses as any) || {};
        const updatedStatuses = {
            ...currentStatuses,
            [matchday]: status
        };

        await prisma.team.update({
            where: { id: teamId },
            data: { matchdayStatuses: updatedStatuses }
        });

        return NextResponse.json({ success: true, statuses: updatedStatuses });
    } catch (error) {
        return NextResponse.json({ error: 'Error updating status' }, { status: 500 });
    }
}
