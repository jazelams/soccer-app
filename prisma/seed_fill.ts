
import { PrismaClient, DayOfWeek, TournamentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const TARGETS: Record<string, number> = {
    MONDAY: 16,
    TUESDAY: 12,
    WEDNESDAY: 16,
    THURSDAY: 14,
    FRIDAY: 16,
    SATURDAY: 10,
};

async function main() {
    console.log('Start filling teams...');

    for (const [day, targetCount] of Object.entries(TARGETS)) {
        const dayEnum = day as DayOfWeek;

        // 1. Find the tournament
        let tournament = await prisma.tournament.findUnique({
            where: { day: dayEnum },
            include: { _count: { select: { teams: true } } }
        });

        if (!tournament) {
            console.log(`Tournament for ${day} not found. Creating it...`);
            tournament = await prisma.tournament.create({
                data: {
                    name: `Torneo ${day}`,
                    day: dayEnum,
                    startDate: new Date(),
                    status: TournamentStatus.ACTIVE
                },
                include: { _count: { select: { teams: true } } }
            });
        }

        const currentCount = tournament._count.teams;
        const needed = targetCount - currentCount;

        console.log(`${day}: Current ${currentCount}, Target ${targetCount}, Needed ${needed}`);

        if (needed > 0) {
            const teamsToCreate = [];
            for (let i = 0; i < needed; i++) {
                // Generate a name like "Equipo MONDAY 17" if 16 exist? No, "Equipo X"
                // To avoid name collision if possible, though name isn't unique in schema.
                teamsToCreate.push({
                    name: `Equipo ${day.substring(0, 3)} ${currentCount + i + 1}`,
                    tournamentId: tournament.id,
                    registrationFee: 500,
                    arbitrationFee: 450,
                    discountAmount: 0,
                    active: true
                });
            }

            await prisma.team.createMany({
                data: teamsToCreate
            });
            console.log(`Created ${needed} teams for ${day}`);
        } else {
            console.log(`Enough teams for ${day}.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
