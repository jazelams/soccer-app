import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { checkAuth, unauthorized, forbidden } from '@/app/lib/api-utils';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const user: any = await checkAuth(request);
    if (!user) return unauthorized();

    try {
        const id = (await params).id;
        const teamId = Number(id);

        // Security check: Only Admin, Treasurer, or the Team's own user
        if (user.role === 'TEAM_REPRESENTATIVE' && user.teamId !== teamId) {
            return forbidden();
        }

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                tournament: true,
                payments: {
                    orderBy: { recordedAt: 'desc' }
                }
            }
        });

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const regFee = Number(team.registrationFee);
        const arbFee = Number(team.arbitrationFee);
        const discount = Number(team.discountAmount);
        const totalBase = regFee + arbFee;
        const totalToPay = totalBase - discount;

        const totalPaid = team.payments.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
        const balance = totalToPay - totalPaid;

        let status = 'PENDING';
        if (balance <= 0) status = 'PAID';
        else if (totalPaid > 0) status = 'PARTIAL';

        const response = {
            teamInfo: {
                id: team.id,
                name: team.name,
                tournament: team.tournament.name,
                tournamentId: team.tournament.id,
                day: team.tournament.day,
            },
            financialSummary: {
                baseAmount: totalBase,
                registration: regFee,
                arbitration: arbFee,
                discount: discount,
                totalToPay: totalToPay,
                totalPaid: totalPaid,
                balance: balance,
                status: status
            },
            payments: team.payments.map((p: any) => ({
                id: p.id,
                amount: Number(p.amount),
                method: p.method,
                reference: p.transferRef,
                date: p.recordedAt,
                matchday: p.matchday,
                notes: p.notes
            })),
            matchdayStatuses: team.matchdayStatuses || {}
        };

        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json({ error: 'Error generating statement' }, { status: 500 });
    }
}
