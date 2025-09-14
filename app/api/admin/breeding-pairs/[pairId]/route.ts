import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import {
    breedingPairs,
    creatures,
    researchGoals,
    breedingLogEntries,
    achievedGoals,
} from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction } from '@/lib/audit';
import { enrichAndSerializeCreature, enrichAndSerializeGoal } from '@/lib/serialization';
import { enrichAndSerializeBreedingPair } from '@/lib/data-helpers'; // We'll create this helper
import * as Sentry from '@sentry/nextjs';

export async function GET(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: fetching breeding pair ${params.pairId}`, 'log');
    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin fetch breeding pair ${params.pairId}`,
            'warning'
        );
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const pair = await db.query.breedingPairs.findFirst({
            where: eq(breedingPairs.id, params.pairId),
            with: { maleParent: true, femaleParent: true },
        });

        if (!pair || !pair.maleParent || !pair.femaleParent) {
            Sentry.captureMessage(`Admin: breeding pair not found ${params.pairId}`, 'warning');
            return NextResponse.json({ error: 'Breeding pair not found' }, { status: 404 });
        }

        const ownerId = pair.userId;
        const [allGoals, logEntries, allCreatures, allUserAchievedGoals, allRawPairs] =
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
                }),
            ]);

        const enrichedPair = enrichAndSerializeBreedingPair(
            pair,
            allGoals.map((g) => enrichAndSerializeGoal(g, g.goalMode)),
            logEntries,
            allCreatures.map(enrichAndSerializeCreature),
            allUserAchievedGoals,
            allRawPairs
        );

        Sentry.captureMessage(`Admin: successfully fetched breeding pair ${params.pairId}`, 'info');
        return NextResponse.json({
            pair: enrichedPair,
            allCreatures: allCreatures.map(enrichAndSerializeCreature),
            allGoals: allGoals.map((g) => enrichAndSerializeGoal(g, g.goalMode)),
            allPairs: allRawPairs,
            allLogs: logEntries.map((log) => ({
                ...log,
                createdAt: log.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Failed to fetch breeding pair details:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ pairId: string }> }) {
    const params = await props.params;
    const session = await auth();
    Sentry.captureMessage(`Admin: deleting breeding pair ${params.pairId}`, 'log');

    if (!session?.user?.id || session.user.role !== 'admin') {
        Sentry.captureMessage(
            `Forbidden access to admin delete breeding pair ${params.pairId}`,
            'warning'
        );
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const targetPair = await db.query.breedingPairs.findFirst({
            where: eq(breedingPairs.id, params.pairId),
            columns: { pairName: true, userId: true },
        });

        if (!targetPair) {
            Sentry.captureMessage(
                `Admin: breeding pair to delete not found ${params.pairId}`,
                'warning'
            );
            return NextResponse.json({ error: 'Breeding pair not found.' }, { status: 404 });
        }

        await db.delete(breedingPairs).where(eq(breedingPairs.id, params.pairId));

        await logAdminAction({
            action: 'breeding_pair.delete',
            targetType: 'breeding_pair',
            targetId: params.pairId,
            targetUserId: targetPair.userId,
            details: {
                deletedPairName: targetPair.pairName,
            },
        });

        Sentry.captureMessage(`Admin: successfully deleted breeding pair ${params.pairId}`, 'info');
        return NextResponse.json({
            message: 'Breeding pair deleted successfully.',
        });
    } catch (error) {
        console.error('Failed to delete breeding pair:', error);
        Sentry.captureException(error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
