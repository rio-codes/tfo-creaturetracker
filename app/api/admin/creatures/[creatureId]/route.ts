import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import {
    creatures,
    breedingPairs,
    researchGoals,
    breedingLogEntries,
    achievedGoals,
} from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/serialization';
import { enrichAndSerializeBreedingPair } from '@/lib/data-helpers';
import type { EnrichedBreedingPair } from '@/types';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: fetching creature ${params.creatureId}`, 'log');

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin fetch creature ${params.creatureId}`,
            'warning'
        );
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const creature = await db.query.creatures.findFirst({
            where: eq(creatures.id, params.creatureId),
        });

        if (!creature) {
            Sentry.captureMessage(`Admin: creature not found ${params.creatureId}`, 'warning');
            return NextResponse.json({ error: 'Creature not found' }, { status: 404 });
        }

        const ownerId = creature.userId;

        // Fetch all necessary data for the owner to enrich cards
        const [allGoals, logEntries, allCreatures, allUserAchievedGoals, allRawPairsWithParents] =
            await Promise.all([
                db.query.researchGoals.findMany({
                    where: eq(researchGoals.userId, ownerId),
                }),
                db.query.breedingLogEntries.findMany({
                    where: eq(breedingLogEntries.userId, ownerId),
                }),
                db.query.creatures.findMany({
                    where: eq(creatures.userId, ownerId),
                }),
                db.query.achievedGoals.findMany({
                    where: eq(achievedGoals.userId, ownerId),
                }),
                db.query.breedingPairs.findMany({
                    where: eq(breedingPairs.userId, ownerId),
                    with: { maleParent: true, femaleParent: true },
                }),
            ]);

        const enrichedCreatures = allCreatures.map(enrichAndSerializeCreature);
        const enrichedGoals = allGoals.map((g) => enrichAndSerializeGoal(g, g.goalMode));
        const rawPairs = allRawPairsWithParents.map(
            ({ maleParent, femaleParent, ...rest }) => rest
        );

        const enrichedPairs = allRawPairsWithParents
            .map((pair) =>
                enrichAndSerializeBreedingPair(
                    pair,
                    enrichedGoals,
                    logEntries,
                    enrichedCreatures,
                    allUserAchievedGoals,
                    rawPairs
                )
            )
            .filter((p): p is EnrichedBreedingPair => p !== null);

        Sentry.captureMessage(`Admin: successfully fetched creature ${params.creatureId}`, 'info');
        return NextResponse.json({
            creature: enrichAndSerializeCreature(creature),
            allCreatures: enrichedCreatures,
            allPairs: enrichedPairs,
            allGoals: enrichedGoals,
        });
    } catch (error) {
        console.error('Failed to fetch creature details:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ creatureId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: deleting creature ${params.creatureId}`, 'log');

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin delete creature ${params.creatureId}`,
            'warning'
        );
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const targetCreature = await db.query.creatures.findFirst({
            where: eq(creatures.id, params.creatureId),
            columns: { code: true, creatureName: true, userId: true },
        });

        if (!targetCreature) {
            Sentry.captureMessage(
                `Admin: creature to delete not found ${params.creatureId}`,
                'warning'
            );
            return NextResponse.json({ error: 'Creature not found.' }, { status: 404 });
        }

        await db.delete(creatures).where(eq(creatures.id, params.creatureId));

        await logAdminAction({
            action: 'creature.delete',
            targetType: 'creature',
            targetId: params.creatureId,
            targetUserId: targetCreature.userId,
            details: {
                deletedCreatureCode: targetCreature.code,
                deletedCreatureName: targetCreature.creatureName,
            },
        });

        Sentry.captureMessage(`Admin: successfully deleted creature ${params.creatureId}`, 'info');
        return NextResponse.json({ message: 'Creature deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete creature:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
