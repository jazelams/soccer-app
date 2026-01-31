import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { checkAuth, unauthorized, forbidden } from '@/app/lib/api-utils';
import { z } from 'zod';

const updateSchema = z.object({
    name: z.string().optional(),
    registrationFee: z.number().optional(),
    arbitrationFee: z.number().optional(),
    discountAmount: z.number().optional(),
});

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'TREASURER'].includes(user.role)) return forbidden();

    try {
        const { id } = await params;
        const body = await request.json();
        const data = updateSchema.parse(body);

        const team = await prisma.team.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                registrationFee: data.registrationFee,
                arbitrationFee: data.arbitrationFee,
                discountAmount: data.discountAmount
            }
        });

        return NextResponse.json(team);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating team' }, { status: 400 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'TREASURER'].includes(user.role)) return forbidden();

    try {
        const { id } = await params;
        const teamId = Number(id);

        // Delete related payments first to avoid foreign key constraints
        await prisma.payment.deleteMany({ where: { teamId } });

        await prisma.team.delete({
            where: { id: teamId }
        });

        return NextResponse.json({ message: 'Team deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting team' }, { status: 500 });
    }
}
