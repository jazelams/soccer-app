import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { checkAuth, unauthorized, forbidden } from '../../lib/api-utils';
import { z } from 'zod';

const paymentSchema = z.object({
    teamId: z.number(),
    amount: z.number().positive(),
    method: z.enum(['CASH', 'TRANSFER']),
    transferRef: z.string().optional(),
    transferDate: z.string().optional(),
    matchday: z.number().min(1).max(10).optional(),
    notes: z.string().optional()
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'TREASURER'].includes(user.role)) return forbidden();

    try {
        const body = await request.json();
        const data = paymentSchema.parse(body);

        if (data.method === 'TRANSFER' && !data.transferRef) {
            return NextResponse.json({ error: 'Transfer reference required for transfers' }, { status: 400 });
        }

        const payment = await prisma.payment.create({
            data: {
                teamId: data.teamId,
                amount: data.amount,
                method: data.method as any,
                transferRef: data.transferRef,
                transferDate: data.transferDate ? new Date(data.transferDate) : null,
                matchday: data.matchday,
                notes: data.notes
            }
        });

        return NextResponse.json(payment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
    }
}
