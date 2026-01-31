import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'TREASURER', 'TEAM_REPRESENTATIVE']),
    teamId: z.number().optional(),
});

// LOGIN
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !await bcrypt.compare(password, user.password)) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        const token = generateToken({ id: user.id, username: user.username, role: user.role, teamId: user.teamId });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, teamId: user.teamId } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// REGISTER (Admin only ideally, but public for setup now)
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, password, role, teamId } = registerSchema.parse(req.body);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: role as any,
                teamId
            }
        });

        res.json({ message: 'User created', userId: user.id });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Registration failed or user exists' });
    }
});

export default router;
