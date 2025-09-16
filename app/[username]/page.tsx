import { notFound } from 'next/navigation';
import { db } from '@/src/db';
import {
    users,
    creatures,
    researchGoals,
    friendships,
    achievedGoals,
    breedingLogEntries,
    breedingPairs,
} from '@/src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaCrown, FaStar } from 'react-icons/fa';
import { auth } from '@/auth';
import { RESERVED_USER_PATHS } from '@/constants/paths';
import { FriendshipButton } from '@/components/custom-buttons/friendship-button';
import { FeaturedCreatureCard } from '@/components/custom-cards/featured-creature-card';
import { FeaturedGoalCard } from '@/components/custom-cards/featured-goal-card';
import { SocialLinks } from '@/components/misc-custom-components/social-links';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { calculateGeneProbability } from '@/lib/genetics'; // This function must be exported from lib/genetics.ts
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    DbCreature,
    GoalGene,
    DbResearchGoal,
    DbBreedingPair,
    DbAchievedGoal,
    DbBreedingLogEntry,
} from '@/types';

type AchievementMap = {
    [goalId: string]: { creature: DbCreature };
};

export type FeaturedGoalProgress = {
    assignedPairCount: number;
    highestScoringPair: {
        name: string;
        maleParentName: string;
        maleParentCode: string;
        maleParentImageUrl: string;
        femaleParentName: string;
        femaleParentCode: string;
        femaleParentImageUrl: string;
        score: number;
    } | null;
    progenyCount: number;
    closestProgeny: {
        name: string;
        code: string;
        imageUrl: string;
        accuracy: number;
    } | null;
};

type GoalProgressMap = {
    [goalId: string]: FeaturedGoalProgress;
};

type UserStats = {
    totalCreatures: number;
    totalSyncedSpecies: number;
    mostNumerousSpecies: string;
    achievedGoalsCount: number;
};

async function fetchUserProfile(username: string, sessionUserId?: string | null) {
    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
        columns: {
            password: false, // Ensure password is not fetched
        },
    });

    if (!user) {
        return null;
    }

    let friendship = null;
    if (sessionUserId && sessionUserId !== user.id) {
        const [userOneId, userTwoId] =
            sessionUserId < user.id ? [sessionUserId, user.id] : [user.id, sessionUserId];

        friendship = await db.query.friendships.findFirst({
            where: and(eq(friendships.userOneId, userOneId), eq(friendships.userTwoId, userTwoId)),
        });
    }

    const featuredGoalsDb = user.featuredGoalIds?.length
        ? await db
              .select()
              .from(researchGoals)
              .where(
                  and(
                      eq(researchGoals.userId, user.id),
                      inArray(researchGoals.id, user.featuredGoalIds)
                  )
              )
        : [];

    const featuredCreaturesDb = user.featuredCreatureIds?.length
        ? await db
              .select()
              .from(creatures)
              .where(
                  and(
                      eq(creatures.userId, user.id),
                      inArray(creatures.id, user.featuredCreatureIds)
                  )
              )
        : [];

    // iterate over featuredCreatures and use function enrichCreatures on each one
    const featuredCreatures: EnrichedCreature[] = featuredCreaturesDb.map((creature: DbCreature) =>
        enrichAndSerializeCreature(creature)
    );

    const featuredGoals: EnrichedResearchGoal[] = featuredGoalsDb.map((goal: DbResearchGoal) => ({
        ...goal,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        genes: goal.genes as { [category: string]: GoalGene },
    }));

    const achievementsList = user.featuredGoalIds?.length
        ? await db
              .select()
              .from(achievedGoals)
              .leftJoin(creatures, eq(achievedGoals.matchingProgenyId, creatures.id))
              .where(
                  and(
                      eq(achievedGoals.userId, user.id),
                      inArray(achievedGoals.goalId, user.featuredGoalIds)
                  )
              )
        : [];

    const achievements: AchievementMap = achievementsList.reduce((acc, item) => {
        if (item.achieved_goal && item.creature) {
            acc[item.achieved_goal.goalId] = { creature: item.creature };
        }
        return acc;
    }, {} as AchievementMap);

    // Calculate user statistics
    let stats: UserStats | null = null;
    if (user.showStats) {
        const [allCreaturesForUser, achievedGoalsForUser] = await Promise.all([
            db.query.creatures.findMany({ where: eq(creatures.userId, user.id) }),
            db.query.achievedGoals.findMany({
                where: eq(achievedGoals.userId, user.id),
            }) as Promise<DbAchievedGoal[]>,
        ]);

        const speciesCounts = allCreaturesForUser.reduce(
            (acc, creature) => {
                if (creature.species) {
                    acc[creature.species] = (acc[creature.species] || 0) + 1;
                }
                return acc;
            },
            {} as Record<string, number>
        );

        const mostNumerousSpeciesEntry = Object.entries(speciesCounts).sort(
            ([, a], [, b]) => b - a
        )[0];

        stats = {
            totalCreatures: allCreaturesForUser.length,
            totalSyncedSpecies: Object.keys(speciesCounts).length,
            mostNumerousSpecies: mostNumerousSpeciesEntry
                ? `${mostNumerousSpeciesEntry[0]} (${mostNumerousSpeciesEntry[1]})`
                : 'N/A',
            achievedGoalsCount: achievedGoalsForUser.length,
        };
    }

    const goalProgress: GoalProgressMap = {};

    const allAssignedPairIds = featuredGoals
        .flatMap((g) => g.assignedPairIds || [])
        .filter((id, index, self) => self.indexOf(id) === index);

    let allAssignedPairs: (DbBreedingPair & {
        maleParent: DbCreature | null;
        femaleParent: DbCreature | null;
    })[] = [];
    let allLogsForAssignedPairs: DbBreedingLogEntry[] = [];

    if (allAssignedPairIds.length > 0) {
        [allAssignedPairs, allLogsForAssignedPairs] = await Promise.all([
            db.query.breedingPairs.findMany({
                where: and(
                    eq(breedingPairs.userId, user.id),
                    inArray(breedingPairs.id, allAssignedPairIds)
                ),
                with: { maleParent: true, femaleParent: true },
            }),
            db.query.breedingLogEntries.findMany({
                where: and(
                    eq(breedingLogEntries.userId, user.id),
                    inArray(breedingLogEntries.pairId, allAssignedPairIds)
                ),
            }),
        ]);
    }

    const allProgenyIds = new Set<string>();
    allLogsForAssignedPairs.forEach((log) => {
        if (log.progeny1Id) allProgenyIds.add(log.progeny1Id);
        if (log.progeny2Id) allProgenyIds.add(log.progeny2Id);
    });

    const allProgeny =
        allProgenyIds.size > 0
            ? await db.query.creatures.findMany({
                  where: and(
                      eq(creatures.userId, user.id),
                      inArray(creatures.id, [...allProgenyIds])
                  ),
              })
            : [];
    const progenyById = new Map(allProgeny.map((p) => [p.id, p]));

    for (const goal of featuredGoals) {
        if (achievements[goal.id]) continue;

        const assignedPairIds = goal.assignedPairIds || [];
        const assignedPairsForGoal = allAssignedPairs.filter((p) => assignedPairIds.includes(p.id));

        const pairScores = assignedPairsForGoal
            .map((pair) => {
                if (!pair.maleParent || !pair.femaleParent) return null;
                const enrichedMale = enrichAndSerializeCreature(pair.maleParent);
                const enrichedFemale = enrichAndSerializeCreature(pair.femaleParent);
                let totalChance = 0,
                    geneCount = 0,
                    isPossible = true;
                for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                    const chance = calculateGeneProbability(
                        enrichedMale,
                        enrichedFemale,
                        category,
                        targetGeneInfo,
                        goal.goalMode
                    );
                    if (!targetGeneInfo.isOptional) {
                        if (chance === 0) isPossible = false;
                        totalChance += chance;
                        geneCount++;
                    }
                }
                return {
                    pair,
                    score: isPossible ? (geneCount > 0 ? totalChance / geneCount : 1) : 0,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

        const highestScoringPair =
            pairScores.length > 0
                ? pairScores.reduce((max, p) => (p.score > max.score ? p : max))
                : null;

        const logsForGoal = allLogsForAssignedPairs.filter((l) =>
            assignedPairIds.includes(l.pairId)
        );
        const progenyIdsForGoal = new Set<string>();
        logsForGoal.forEach((l) => {
            if (l.progeny1Id) progenyIdsForGoal.add(l.progeny1Id);
            if (l.progeny2Id) progenyIdsForGoal.add(l.progeny2Id);
        });

        const progenyForGoal = [...progenyIdsForGoal]
            .map((id) => progenyById.get(id))
            .filter((p): p is DbCreature => !!p);

        let closestProgenyData = null;
        if (progenyForGoal.length > 0) {
            const progenyAccuracies = progenyForGoal
                .map((p) => {
                    const enrichedProgeny = enrichAndSerializeCreature(p);
                    if (!enrichedProgeny) return null;
                    let matchedGenes = 0,
                        totalGenes = 0;
                    for (const [category, targetGeneInfo] of Object.entries(goal.genes)) {
                        if (!targetGeneInfo.isOptional) {
                            totalGenes++;
                            const progenyGene = enrichedProgeny.geneData.find(
                                (g) => g.category === category
                            );
                            if (progenyGene) {
                                if (
                                    goal.goalMode === 'phenotype'
                                        ? progenyGene.phenotype === targetGeneInfo.phenotype
                                        : progenyGene.genotype === targetGeneInfo.genotype
                                ) {
                                    matchedGenes++;
                                }
                            }
                        }
                    }
                    return { progeny: p, accuracy: totalGenes > 0 ? matchedGenes / totalGenes : 0 };
                })
                .filter((p): p is NonNullable<typeof p> => p !== null);

            if (progenyAccuracies.length > 0) {
                const closest = progenyAccuracies.reduce((max, p) =>
                    p.accuracy > max.accuracy ? p : max
                );
                closestProgenyData = {
                    name: closest.progeny.creatureName || 'Unnamed',
                    code: closest.progeny.code,
                    imageUrl: closest.progeny.imageUrl,
                    accuracy: closest.accuracy,
                };
            }
        }

        goalProgress[goal.id] = {
            assignedPairCount: assignedPairsForGoal.length,
            highestScoringPair: highestScoringPair
                ? {
                      name: highestScoringPair.pair.pairName,
                      maleParentName: highestScoringPair.pair.maleParent!.creatureName || 'Unnamed',
                      maleParentCode: highestScoringPair.pair.maleParent!.code,
                      maleParentImageUrl: highestScoringPair.pair.maleParent!.imageUrl,
                      femaleParentName:
                          highestScoringPair.pair.femaleParent!.creatureName || 'Unnamed',
                      femaleParentCode: highestScoringPair.pair.femaleParent!.code,
                      femaleParentImageUrl: highestScoringPair.pair.femaleParent!.imageUrl,
                      score: highestScoringPair.score,
                  }
                : null,
            progenyCount: progenyIdsForGoal.size,
            closestProgeny: closestProgenyData,
        };
    }

    return {
        user,
        featuredCreatures,
        featuredGoals,
        friendship,
        achievements,
        goalProgress,
        stats,
    };
}

function SupporterIcon({ tier }: { tier: string | null | undefined }) {
    if (tier === 'patron') {
        return <FaCrown className="inline-block ml-2 text-yellow-500" title="Patreon Supporter" />;
    }
    if (tier === 'beta') {
        return <FaStar className="inline-block ml-2 text-blue-500" title="Beta Tester" />;
    }
    return null;
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const session = await auth();
    const pathUsername = params.username;
    let dbUsername: string;
    const prefix = 'tfoct-';

    if (pathUsername.toLowerCase().startsWith(prefix)) {
        const potentialUsername = pathUsername.substring(prefix.length);
        if (!RESERVED_USER_PATHS.includes(potentialUsername.toLowerCase())) {
            notFound();
        }
        dbUsername = potentialUsername;
    } else {
        if (RESERVED_USER_PATHS.includes(pathUsername.toLowerCase())) {
            notFound();
        }
        dbUsername = pathUsername;
    }

    const data = await fetchUserProfile(dbUsername, session?.user?.id);

    if (!data) {
        notFound();
    }
    const {
        user,
        featuredCreatures,
        featuredGoals,
        friendship,
        achievements,
        goalProgress,
        stats,
    } = data;

    return (
        <div className="container mx-auto py-10 ">
            <Card className="bg-ebena-lavender text-pompaca-purple dark:text-purple-300 dark:bg-pompaca-purple border-pompaca-purple/30 drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900">
                <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="h-24 w-24 border-2 border-pompaca-purple dark:border-purple-400 rounded-full drop-shadow-lg drop-shadow-gray-500 dark:drop-shadow-gray-900 z-20">
                        <AvatarImage src={user.image ?? undefined} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <CardTitle className="text-3xl text-pompaca-purple dark:text-purple-300">
                            {user.username}
                            {user.pronouns && (
                                <span className="text-lg font-normal text-dusk-purple dark:text-purple-400 ml-2">
                                    ({user.pronouns})
                                </span>
                            )}
                            <SupporterIcon tier={user.supporterTier} />
                        </CardTitle>
                        <CardDescription className="text-pompaca-purple dark:text-purple-400">
                            Joined on {new Date(user.createdAt).toLocaleDateString()}
                        </CardDescription>
                        {user.statusMessage && (
                            <div className="mt-2 flex items-center gap-2 rounded-full border border-pompaca-purple/30 bg-dusk-purple/20 px-3 py-1 w-fit">
                                <span>{user.statusEmoji}</span>
                                <p className="text-sm text-pompaca-purple dark:text-purple-300">
                                    {user.statusMessage}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="self-start sm:self-center">
                        <FriendshipButton
                            profileUserId={user.id}
                            sessionUserId={session?.user?.id ?? null}
                            initialStatus={friendship?.status ?? null}
                            actionUserId={friendship?.actionUserId ?? null}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                        {user.socialLinks && user.socialLinks.length > 0 && (
                            <SocialLinks links={user.socialLinks} />
                        )}
                        {user.showLabLink && (
                            <a
                                href={`https://finaloutpost.net/lab/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-dusk-purple dark:text-purple-400 hover:underline"
                            >
                                View TFO Lab
                            </a>
                        )}
                    </div>
                    {user.bio && (
                        <div className="mt-4 border-1 p-3 rounded-md bg-dusk-purple text-barely-lilac dark:bg-midnight-purple border-pompaca-purple/30 drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900 z-10">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300">
                                Bio
                            </h2>
                            <p className="text-pompaca-purple dark:text-purple-400 whitespace-pre-wrap">
                                {user.bio}
                            </p>
                        </div>
                    )}

                    {stats && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 mb-4">
                                Statistics
                            </h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                <Card className="bg-dusk-purple/20 p-4">
                                    <p className="text-xl font-bold">{stats.totalCreatures}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400">
                                        Total Creatures
                                    </p>
                                </Card>
                                <Card className="bg-dusk-purple/20 p-4">
                                    <p className="text-xl font-bold">{stats.totalSyncedSpecies}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400">
                                        Total Species
                                    </p>
                                </Card>
                                <Card className="bg-dusk-purple/20 p-4">
                                    <p className="text-xl font-bold">{stats.mostNumerousSpecies}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400">
                                        Most Numerous Species
                                    </p>
                                </Card>
                                <Card className="bg-dusk-purple/20 p-4">
                                    <p className="text-xl font-bold">{stats.achievedGoalsCount}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400">
                                        Goals Achieved
                                    </p>
                                </Card>
                            </div>
                        </div>
                    )}

                    {featuredCreatures.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 mb-4">
                                Featured Creatures
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {featuredCreatures.map((creature) => (
                                    <FeaturedCreatureCard key={creature!.id} creature={creature} />
                                ))}
                            </div>
                        </div>
                    )}

                    {featuredGoals.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 mb-4">
                                Featured Research Goals
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {featuredGoals.map((goal) => (
                                    <FeaturedGoalCard
                                        key={goal.id}
                                        goal={goal}
                                        achievement={achievements[goal.id]}
                                        username={user.username}
                                        progress={goalProgress[goal.id]}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 mb-4">
                            Achievements
                        </h2>
                        <div className="text-center text-dusk-purple dark:text-purple-400 italic py-8 bg-dusk-purple/20 rounded-lg">
                            <p>No achievements to display yet.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
