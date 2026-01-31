import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { checkAuth, unauthorized, forbidden } from '@/app/lib/api-utils';
import { z } from 'zod';

const teamSchema = z.object({
    name: z.string(),
    tournamentId: z.number(),
    registrationFee: z.number(),
    arbitrationFee: z.number(),
    discountAmount: z.number().default(0),
});

export async function POST(request: Request) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'TREASURER'].includes(user.role)) return forbidden();

    try {
        const body = await request.json();
        const data = teamSchema.parse(body);

        const team = await prisma.team.create({
            data: {
                name: data.name,
                tournamentId: data.tournamentId,
                registrationFee: data.registrationFee,
                arbitrationFee: data.arbitrationFee,
                discountAmount: data.discountAmount,
            }
        });

        return NextResponse.json(team);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating team' }, { status: 400 });
    }
}
