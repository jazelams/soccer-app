import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const tournamentSchema = z.object({
    name: z.string(),
    day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']),
    startDate: z.string().optional(), // ISO String
});

const updateTournamentSchema = z.object({
    name: z.string().optional(),
    startDate: z.string().optional(), // ISO String
    status: z.enum(['ACTIVE', 'FINISHED']).optional(),
});

// Get all tournaments
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const tournaments = await prisma.tournament.findMany({
            orderBy: { id: 'asc' },
            include: {
                _count: {
                    select: { teams: true }
                }
            }
        });
        res.json(tournaments);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tournaments' });
    }
});

// Get Single Tournament with Teams
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
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
            res.status(404).json({ error: 'Tournament not found' });
            return;
        }

        res.json(tournament);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching tournament details' });
    }
});

// Create Tournament
router.post('/', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const data = tournamentSchema.parse(req.body);

        const tournament = await prisma.tournament.create({
            data: {
                name: data.name,
                day: data.day,
                startDate: data.startDate ? new Date(data.startDate) : new Date(),
                status: 'ACTIVE'
            } as any
        });

        res.status(201).json(tournament);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: (error as z.ZodError).errors });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Error creating tournament' });
    }
});

// Update Tournament
router.put('/:id', authenticate, authorize(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateTournamentSchema.parse(req.body);

        const tournament = await prisma.tournament.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                status: data.status
            } as any
        });

        res.json(tournament);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating tournament' });
    }
});

export default router;
