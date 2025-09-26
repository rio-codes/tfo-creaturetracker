import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, PawPrint, Heart, Target, Trophy, Dna, Rabbit, Sparkles } from 'lucide-react';
import { db } from '@/src/db';
import {
    users,
    creatures,
    breedingPairs,
    researchGoals,
    breedingLogEntries,
} from '@/src/db/schema';
import { count, gte, desc, sql, isNotNull, eq, and } from 'drizzle-orm';
import { subDays } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { calculateAllPossibleOutcomes } from '@/lib/genetics';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Metrics = {
    totalUsers: number;
    newUsersLastWeek: number;
    totalCreatures: number;
    totalPairs: number;
    totalGoals: number;
    recentUsers: (typeof users.$inferSelect)[];
};
type TopUser = {
    username: string | null;
    image: string | null;
    id: string;
    creatureCount: number;
} | null;
type PopularSpecies = {
    species: string | null;
    count: number;
} | null;
type ProlificPair = {
    id: string;
    name: string | null;
    timesBred: number;
    breeder: {
        username: string | null;
        id: string;
    } | null;
} | null;
type RandomCreature = {
    image: string | null;
    species: string | null;
    code: string;
    genes: { [category: string]: { genotype: string; phenotype: string } };
} | null;
type FunMetrics = {
    topUser: TopUser;
    popularSpecies: PopularSpecies;
    prolificPair: ProlificPair;
    randomCreature: RandomCreature;
};
async function getMetrics(): Promise<Metrics> {
    const [
        totalUsersResult,
        newUsersLastWeekResult,
        totalCreaturesResult,
        totalPairsResult,
        totalGoalsResult,
        recentUsers,
    ] = await Promise.all([
        db.select({ value: count() }).from(users),
        db
            .select({ value: count() })
            .from(users)
            .where(gte(users.createdAt, subDays(new Date(), 7))),
        db.select({ value: count() }).from(creatures),
        db.select({ value: count() }).from(breedingPairs),
        db.select({ value: count() }).from(researchGoals),
        db.select().from(users).orderBy(desc(users.createdAt)).limit(5),
    ]);
    return {
        totalUsers: totalUsersResult[0].value,
        newUsersLastWeek: newUsersLastWeekResult[0].value,
        totalCreatures: totalCreaturesResult[0].value,
        totalPairs: totalPairsResult[0].value,
        totalGoals: totalGoalsResult[0].value,
        recentUsers,
    };
}
async function getFunMetrics(): Promise<FunMetrics> {
    const topUserQuery = await db
        .select({
            ownerId: creatures.userId,
            count: sql<number>`count(${creatures.id})`.mapWith(Number).as('creature_count'),
        })
        .from(creatures)
        .where(isNotNull(creatures.userId))
        .groupBy(creatures.userId)
        .orderBy(desc(sql`creature_count`))
        .limit(1);
    let topUser: TopUser = null;
    if (topUserQuery.length > 0) {
        const { ownerId, count } = topUserQuery[0];
        const user = await db.query.users.findFirst({
            where: eq(users.id, ownerId!),
            columns: { id: true, username: true, image: true },
        });
        if (user) {
            topUser = { ...user, creatureCount: count };
        }
    }
    const popularSpeciesQuery = await db
        .select({
            species: creatures.species,
            count: sql<number>`count(${creatures.id})`.mapWith(Number).as('species_count'),
        })
        .from(creatures)
        .where(isNotNull(creatures.species))
        .groupBy(creatures.species)
        .orderBy(desc(sql`species_count`))
        .limit(1);
    const popularSpecies: PopularSpecies =
        popularSpeciesQuery.length > 0 ? popularSpeciesQuery[0] : null;
    const prolificPairLogQuery = await db
        .select({
            pairId: breedingLogEntries.pairId,
            timesBred: sql<number>`count(${breedingLogEntries.id})`
                .mapWith(Number)
                .as('times_bred'),
        })
        .from(breedingLogEntries)
        .where(isNotNull(breedingLogEntries.pairId))
        .groupBy(breedingLogEntries.pairId)
        .orderBy(desc(sql`times_bred`))
        .limit(1);
    let prolificPair: ProlificPair = null;
    if (prolificPairLogQuery.length > 0) {
        const { pairId, timesBred } = prolificPairLogQuery[0];
        if (pairId) {
            const pairInfo = await db.query.breedingPairs.findFirst({
                where: eq(breedingPairs.id, pairId),
                columns: {
                    id: true,
                    pairName: true,
                    userId: true,
                },
            });
            if (pairInfo && pairInfo.userId) {
                const breederInfo = await db.query.users.findFirst({
                    where: eq(users.id, pairInfo.userId),
                    columns: { id: true, username: true },
                });
                prolificPair = {
                    id: pairInfo.id,
                    name: pairInfo.pairName,
                    timesBred: timesBred,
                    breeder: breederInfo
                        ? { id: breederInfo.id, username: breederInfo.username }
                        : null,
                };
            }
        }
    }
    let randomCreature: RandomCreature = null;
    const randomPair = await db.query.breedingPairs.findFirst({
        orderBy: sql`RANDOM()`,
        where: and(isNotNull(breedingPairs.maleParentId), isNotNull(breedingPairs.femaleParentId)),
        with: {
            maleParent: true,
            femaleParent: true,
        },
    });
    if (randomPair && randomPair.maleParent && randomPair.femaleParent) {
        const maleParentEnriched = enrichAndSerializeCreature(randomPair.maleParent);
        const femaleParentEnriched = enrichAndSerializeCreature(randomPair.femaleParent);
        const outcomesByCategory = calculateAllPossibleOutcomes(
            maleParentEnriched,
            femaleParentEnriched
        );
        const selectedGenes: { [category: string]: { genotype: string; phenotype: string } } = {};
        for (const category in outcomesByCategory) {
            const outcomes = outcomesByCategory[category];
            let rand = Math.random();
            let chosenOutcome = outcomes[outcomes.length - 1];
            for (const outcome of outcomes) {
                if (rand < outcome.probability) {
                    chosenOutcome = outcome;
                    break;
                }
                rand -= outcome.probability;
            }
            selectedGenes[category] = {
                genotype: chosenOutcome.genotype,
                phenotype: chosenOutcome.phenotype,
            };
        }
        const selectedGenotypes = Object.fromEntries(
            Object.entries(selectedGenes).map(([cat, gene]) => [cat, gene.genotype])
        );
        let imageUrl: string | null = null;
        try {
            const tfoImageUrl = constructTfoImageUrl(randomPair.species, selectedGenotypes);
            const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
            imageUrl = await fetchAndUploadWithRetry(
                bustedTfoImageUrl,
                `pair-preview-${randomPair.id}`,
                3
            );
        } catch (error) {
            console.error('Failed to generate preview image for admin metrics:', error);
        }
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        for (let i = 0; i < 5; i++) {
            randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        randomCreature = {
            image: imageUrl,
            species: randomPair.species,
            code: randomCode,
            genes: selectedGenes,
        };
    }
    return { topUser, popularSpecies, prolificPair, randomCreature };
}
export default async function AdminMetricsPage() {
    const [metrics, funMetrics] = await Promise.all([getMetrics(), getFunMetrics()]);
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                            {metrics.totalUsers}
                        </div>
                        <p className="text-xs text-dusk-purple dark:text-purple-400">
                            +{metrics.newUsersLastWeek} in the last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                            Total Creatures
                        </CardTitle>
                        <PawPrint className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                            {metrics.totalCreatures}
                        </div>
                        <p className="text-xs text-dusk-purple dark:text-purple-400">&nbsp;</p>
                    </CardContent>
                </Card>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                            Total Breeding Pairs
                        </CardTitle>
                        <Heart className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                            {metrics.totalPairs}
                        </div>
                        <p className="text-xs text-dusk-purple dark:text-purple-400">&nbsp;</p>
                    </CardContent>
                </Card>
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                            Total Research Goals
                        </CardTitle>
                        <Target className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                            {metrics.totalGoals}
                        </div>
                        <p className="text-xs text-dusk-purple dark:text-purple-400">&nbsp;</p>
                    </CardContent>
                </Card>
            </div>
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-pompaca-purple dark:text-purple-300 mb-4">
                    Fun Facts
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                                Top Collector
                            </CardTitle>
                            <Trophy className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            {funMetrics.topUser ? (
                                <div className="flex items-center pt-2">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage
                                            src={funMetrics.topUser.image ?? ''}
                                            alt="Avatar"
                                        />
                                        <AvatarFallback>
                                            {funMetrics.topUser.username?.charAt(0).toUpperCase() ??
                                                '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <Link
                                            href={`/admin/users/${funMetrics.topUser.id}`}
                                            className="text-sm font-medium leading-none text-pompaca-purple hover:underline dark:text-purple-300"
                                        >
                                            {funMetrics.topUser.username || 'Unnamed User'}
                                        </Link>
                                        <p className="text-sm text-dusk-purple dark:text-purple-400">
                                            {funMetrics.topUser.creatureCount} creatures
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-dusk-purple dark:text-purple-400 pt-2">
                                    No data available.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                                Most Popular Species
                            </CardTitle>
                            <Dna className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            {funMetrics.popularSpecies ? (
                                <>
                                    <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                                        {funMetrics.popularSpecies.species}
                                    </div>
                                    <p className="text-xs text-dusk-purple dark:text-purple-400">
                                        with {funMetrics.popularSpecies.count} total creatures
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-dusk-purple dark:text-purple-400 pt-2">
                                    No data available.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                                Most Prolific Pair
                            </CardTitle>
                            <Rabbit className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            {funMetrics.prolificPair ? (
                                <>
                                    <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                                        {funMetrics.prolificPair.name || 'Unnamed Pair'}
                                    </div>
                                    <p className="text-xs text-dusk-purple dark:text-purple-400">
                                        Bred {funMetrics.prolificPair.timesBred} times by{' '}
                                        <Link
                                            href={`/admin/users/${funMetrics.prolificPair.breeder?.id}`}
                                            className="hover:underline"
                                        >
                                            {funMetrics.prolificPair.breeder?.username || '...'}
                                        </Link>
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-dusk-purple dark:text-purple-400 pt-2">
                                    No data available.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300">
                                Creature Spotlight
                            </CardTitle>
                            <Sparkles className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            {funMetrics.randomCreature && funMetrics.randomCreature.image ? (
                                <div className="pt-2 text-center">
                                    <img
                                        src={funMetrics.randomCreature.image}
                                        alt={funMetrics.randomCreature.species || 'A creature'}
                                        className="rounded-md object-cover aspect-square w-full"
                                    />
                                    <p className="text-xs mt-2 text-dusk-purple dark:text-purple-400 text-pretty">
                                        A potential{' '}
                                        <span className="font-bold">
                                            {funMetrics.randomCreature.species}
                                        </span>{' '}
                                        with code{' '}
                                        <span className="font-mono font-bold">
                                            {funMetrics.randomCreature.code}
                                        </span>
                                        !
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-dusk-purple dark:text-purple-400 pt-2">
                                    Could not generate a creature.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300">
                            Recent Registrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.image ?? ''} alt="Avatar" />
                                        <AvatarFallback>
                                            {user.username?.charAt(0).toUpperCase() ??
                                                user.email.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1">
                                        <Link
                                            href={`/${user.username}`}
                                            className="text-sm font-medium leading-none text-pompaca-purple hover:underline dark:text-purple-300"
                                        >
                                            {user.username || 'Unnamed User'}
                                        </Link>
                                        <p className="text-sm text-dusk-purple dark:text-purple-400">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
