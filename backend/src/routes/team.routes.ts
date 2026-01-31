import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const teamSchema = z.object({
    name: z.string(),
    tournamentId: z.number(),
    registrationFee: z.number(),
    arbitrationFee: z.number(),
    discountAmount: z.number().default(0),
});

// Create Team (Admin/Treasurer)
router.post('/', authenticate, authorize(['ADMIN', 'TREASURER']), async (req: Request, res: Response) => {
    try {
        const data = teamSchema.parse(req.body);

        const team = await prisma.team.create({
            data: {
                name: data.name,
                tournamentId: data.tournamentId,
                registrationFee: data.registrationFee,
                arbitrationFee: data.arbitrationFee,
                discountAmount: data.discountAmount,
            }
        });

        res.json(team);
    } catch (error) {
        res.status(400).json({ error: 'Error creating team' });
    }
});

// Update Team Details
router.put('/:id', authenticate, authorize(['ADMIN', 'TREASURER']), async (req: Request, res: Response) => {
    const teamId = Number(req.params.id);
    const updateSchema = z.object({
        name: z.string().optional(),
        registrationFee: z.number().optional(),
        arbitrationFee: z.number().optional(),
        discountAmount: z.number().optional(),
    });

    try {
        const data = updateSchema.parse(req.body);

        const team = await prisma.team.update({
            where: { id: teamId },
            data: {
                name: data.name,
                registrationFee: data.registrationFee,
                arbitrationFee: data.arbitrationFee,
                discountAmount: data.discountAmount
            }
        });

        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Error updating team' });
    }
});

// Get Team Detail & Account Statement (CORE LOGIC)
router.get('/:id/statement', authenticate, async (req: AuthRequest, res: Response) => {
    const teamId = Number(req.params.id);

    // Security check: Only Admin, Treasurer, or the Team's own user
    if (req.user.role === 'TEAM_REPRESENTATIVE' && req.user.teamId !== teamId) {
        res.status(403).json({ error: 'Unauthorized to view this team' });
        return;
    }

    try {
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
            res.status(404).json({ error: 'Team not found' });
            return;
        }

        // Calculations
        const regFee = Number(team.registrationFee);
        const arbFee = Number(team.arbitrationFee);
        const discount = Number(team.discountAmount);
        const totalBase = regFee + arbFee;
        const totalToPay = totalBase - discount;

        const totalPaid = team.payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const balance = totalToPay - totalPaid;

        // Status logic
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
            payments: team.payments.map(p => ({
                id: p.id,
                amount: Number(p.amount),
                method: p.method,
                reference: p.transferRef,
                date: p.recordedAt, // Or transferDate
                matchday: p.matchday,
                notes: p.notes
            })),
            matchdayStatuses: team.matchdayStatuses || {}
        };

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating statement' });
    }
});

// Update Matchday Status
router.patch('/:id/matchday-status', authenticate, authorize(['ADMIN', 'TREASURER']), async (req: Request, res: Response) => {
    const teamId = Number(req.params.id);
    const { matchday, status } = req.body;

    if (!matchday || !status) {
        res.status(400).json({ error: 'Matchday and status required' });
        return;
    }

    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) {
            res.status(404).json({ error: 'Team not found' });
            return;
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

        res.json({ success: true, statuses: updatedStatuses });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating status' });
    }
});
// Delete Team
router.delete('/:id', authenticate, authorize(['ADMIN', 'TREASURER']), async (req: Request, res: Response) => {
    const teamId = Number(req.params.id);

    try {
        // Delete related payments first to avoid foreign key constraints
        await prisma.payment.deleteMany({ where: { teamId } });

        await prisma.team.delete({
            where: { id: teamId }
        });

        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error("Error deleting team:", error);
        res.status(500).json({ error: 'Error deleting team' });
    }
});

export default router;
