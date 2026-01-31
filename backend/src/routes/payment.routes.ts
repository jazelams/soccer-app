import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const paymentSchema = z.object({
    teamId: z.number(),
    amount: z.number().positive(),
    method: z.enum(['CASH', 'TRANSFER']),
    transferRef: z.string().optional(),
    transferDate: z.string().optional(), // ISO String
    matchday: z.number().min(1).max(10).optional(),
    notes: z.string().optional()
});

// Register Payment
router.post('/', authenticate, authorize(['ADMIN', 'TREASURER']), async (req: Request, res: Response) => {
    try {
        const data = paymentSchema.parse(req.body);

        if (data.method === 'TRANSFER' && !data.transferRef) {
            res.status(400).json({ error: 'Transfer reference required for transfers' });
            return;
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

        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Error processing payment' });
    }
});

export default router;
