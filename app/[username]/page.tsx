import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/src/db';
import {
    users,
    creatures,
    researchGoals,
    friendships,
    achievedGoals,
    breedingLogEntries,
    breedingPairs,
    userAchievements,
} from '@/src/db/schema';
import { eq, and, inArray, or as drizzleOr } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FlairIcon } from '@/components/misc-custom-components/flair-icon';

import { auth } from '@/auth';
import { RESERVED_USER_PATHS } from '@/constants/paths';
import { FriendshipButton } from '@/components/custom-buttons/friendship-button';
import { FeaturedCreatureCard } from '@/components/custom-cards/featured-creature-card';
import { MessageUserButton } from '@/components/custom-buttons/message-user-button';
import { ReportUserButton } from '@/components/custom-buttons/report-user-button';
import { FeaturedGoalCard } from '@/components/custom-cards/featured-goal-card';
import { SocialLinks } from '@/components/misc-custom-components/social-links';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { calculateGeneProbability } from '@/lib/genetics';
import { CreateChecklistDialog } from '@/components/custom-dialogs/create-checklist-dialog';

import type {
    DbUser,
    EnrichedCreature,
    DbCreature,
    GoalGene,
    DbResearchGoal,
    DbBreedingPair,
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
        maleParentImageUrl: string | null;
        maleParentUpdatedAt: string | null;
        femaleParentName: string;
        femaleParentCode: string;
        femaleParentImageUrl: string | null;
        femaleParentUpdatedAt: string | null;
        score: number;
    } | null;
    progenyCount: number;
    closestProgeny: {
        name: string;
        code: string;
        imageUrl: string | null;
        updatedAt: string | null;
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
    achievedGoalNames: string[];
};

async function fetchUserProfile(username: string, sessionUserId?: string | null): Promise<any> {
    const user = (await db.query.users.findFirst({
        where: eq(users.username, username),
        columns: {
            password: false,
        },
    })) as DbUser | undefined;

    if (!user) {
        return null;
    }

    let friends: { id: string; username: string; image: string | null }[] = [];
    if (user.showFriendsList) {
        const friendshipsList = await db
            .select()
            .from(friendships)
            .where(
                and(
                    drizzleOr(
                        eq(friendships.userOneId, user.id),
                        eq(friendships.userTwoId, user.id)
                    ),
                    eq(friendships.status, 'accepted')
                )
            );

        const friendIds = friendshipsList.map((f) =>
            f.userOneId === user.id ? f.userTwoId : f.userOneId
        );

        if (friendIds.length > 0) {
            friends = await db
                .select({ id: users.id, username: users.username, image: users.image })
                .from(users)
                .where(inArray(users.id, friendIds));
        }
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

    const featuredCreatures: EnrichedCreature[] = featuredCreaturesDb.map((creature: DbCreature) =>
        enrichAndSerializeCreature(creature)
    );

    const featuredGoals = featuredGoalsDb.map((goal: DbResearchGoal) => ({
        ...goal,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        genes: goal.genes as { [category: string]: GoalGene },
    }));

    const achievementsList = user.featuredGoalIds?.length
        ? await db
              .select()
              .from(achievedGoals)
              .leftJoin(
                  creatures,
                  // Use the new composite key for the join
                  and(
                      eq(achievedGoals.matchingProgenyUserId, creatures.userId),
                      eq(achievedGoals.matchingProgenyCode, creatures.code)
                  )
              )
              .where(
                  and(
                      eq(achievedGoals.userId, user.id),
                      inArray(achievedGoals.goalId, user.featuredGoalIds)
                  )
              )
        : [];

    const achievedGoalsByGoalId: AchievementMap = achievementsList.reduce((acc, item) => {
        if (item.achieved_goal && item.creature) {
            acc[item.achieved_goal.goalId] = { creature: item.creature };
        }
        return acc;
    }, {} as AchievementMap);

    const [allCreaturesForUser, achievedGoalsForUser, allUserPairs, allUserLogs] =
        await Promise.all([
            db
                .select({ species: creatures.species })
                .from(creatures)
                .where(eq(creatures.userId, user.id)),
            db
                .select({ goalId: achievedGoals.goalId })
                .from(achievedGoals)
                .where(eq(achievedGoals.userId, user.id)),
            db.query.breedingPairs.findMany({
                where: eq(breedingPairs.userId, user.id),
            }),
            db.query.breedingLogEntries.findMany({
                where: eq(breedingLogEntries.userId, user.id),
            }),
        ]);

    let stats: UserStats | null = null;
    if (user.showStats) {
        let achievedGoalNames: string[] = [];
        if (achievedGoalsForUser.length > 0) {
            const achievedGoalIds = achievedGoalsForUser.map((g) => g.goalId);
            const goals = await db
                .select({ name: researchGoals.name })
                .from(researchGoals)
                .where(inArray(researchGoals.id, achievedGoalIds));
            achievedGoalNames = goals.map((g) => g.name);
        }
        const speciesCounts = allCreaturesForUser.reduce(
            // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
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
            achievedGoalNames,
        };
    }

    const goalProgress: GoalProgressMap = {};

    const allAssignedPairIds = featuredGoals
        .flatMap((g) => g.assignedPairIds || [])
        .filter((id, index, self) => self.indexOf(id) === index);

    const allAssignedPairs = allUserPairs.filter((p) => allAssignedPairIds.includes(p.id));

    if (allAssignedPairIds.length > 0) {
        // Collect all parent composite keys
        const parentKeys = allAssignedPairs.flatMap((p) => [
            { userId: p.maleParentUserId, code: p.maleParentCode },
            { userId: p.femaleParentUserId, code: p.femaleParentCode },
        ]);

        // Fetch all parent creatures in a single query
        let parentCreatures: DbCreature[] = [];
        if (parentKeys.length > 0) {
            parentCreatures = await db
                .select()
                .from(creatures)
                .where(
                    drizzleOr(
                        ...parentKeys.map((key) =>
                            and(eq(creatures.userId, key.userId), eq(creatures.code, key.code))
                        )
                    )
                );
        }
        const parentsByCompositeKey = new Map(
            parentCreatures.map((p) => [`${p.userId}-${p.code}`, p])
        );

        // Manually attach parents to pairs
        allAssignedPairs.forEach((pair) => {
            (pair as any).maleParent =
                parentsByCompositeKey.get(`${pair.maleParentUserId}-${pair.maleParentCode}`) ||
                null;
            (pair as any).femaleParent =
                parentsByCompositeKey.get(`${pair.femaleParentUserId}-${pair.femaleParentCode}`) ||
                null;
        });
    }

    const allLogsForAssignedPairs = allUserLogs.filter((l) =>
        allAssignedPairIds.includes(l.pairId)
    );

    const allProgenyKeys = new Set<string>();
    allLogsForAssignedPairs.forEach((log) => {
        if (log.progeny1UserId && log.progeny1Code)
            allProgenyKeys.add(`${log.progeny1UserId}-${log.progeny1Code}`);
        if (log.progeny2UserId && log.progeny2Code)
            allProgenyKeys.add(`${log.progeny2UserId}-${log.progeny2Code}`);
    });

    const progenyKeysArray = [...allProgenyKeys].map((key) => {
        const [userId, code] = key.split('-');
        return { userId, code };
    });

    const allProgeny =
        progenyKeysArray.length > 0
            ? await db
                  .select()
                  .from(creatures)
                  .where(
                      drizzleOr(
                          ...progenyKeysArray.map((key) =>
                              and(eq(creatures.userId, key.userId), eq(creatures.code, key.code))
                          )
                      )
                  )
            : [];
    const progenyByCompositeKey = new Map(allProgeny.map((p) => [`${p.userId}-${p.code}`, p]));

    for (const goal of featuredGoals) {
        if (achievedGoalsByGoalId[goal.id]) continue;

        const assignedPairIds = goal.assignedPairIds || [];
        const assignedPairsForGoal = allAssignedPairs.filter((p) => assignedPairIds.includes(p.id));
        const pairScores = (
            assignedPairsForGoal as (DbBreedingPair & {
                maleParent: DbCreature | null;
                femaleParent: DbCreature | null;
            })[]
        )
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
        logsForGoal.forEach((log) => {
            if (log.progeny1UserId && log.progeny1Code)
                progenyIdsForGoal.add(`${log.progeny1UserId}-${log.progeny1Code}`);
            if (log.progeny2UserId && log.progeny2Code)
                progenyIdsForGoal.add(`${log.progeny2UserId}-${log.progeny2Code}`);
        });

        const progenyForGoal = [...progenyIdsForGoal]
            .map((compositeKey) => progenyByCompositeKey.get(compositeKey))
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
                    updatedAt: closest.progeny.updatedAt?.toISOString() ?? null,
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
                      maleParentUpdatedAt:
                          highestScoringPair.pair.maleParent!.updatedAt?.toISOString() ?? null,
                      femaleParentName:
                          highestScoringPair.pair.femaleParent!.creatureName || 'Unnamed',
                      femaleParentCode: highestScoringPair.pair.femaleParent!.code,
                      femaleParentImageUrl: highestScoringPair.pair.femaleParent!.imageUrl,
                      femaleParentUpdatedAt:
                          highestScoringPair.pair.femaleParent!.updatedAt?.toISOString() ?? null,
                      score: highestScoringPair.score,
                  }
                : null,
            progenyCount: progenyIdsForGoal.size,
            closestProgeny: closestProgenyData,
        };
    }

    const achievements = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, user.id),
    });

    return {
        user,
        featuredCreatures,
        featuredGoals,
        friendship,
        achievedGoalsByGoalId,
        goalProgress,
        stats,
        friends,
        achievements,
    };
}

export default async function UserProfilePage(props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
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
        achievedGoalsByGoalId,
        goalProgress,
        stats,
        friends,
        achievements,
    } = data;

    return (
        <div className="container mx-auto py-10 ">
            <CreateChecklistDialog />
            <Card className="bg-ebena-lavender text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/30 drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900">
                <CardHeader className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="h-24 w-24 border-2 border-pompaca-purple dark:border-purple-400 rounded-full drop-shadow-lg drop-shadow-gray-500 dark:drop-shadow-gray-900 z-20">
                        <AvatarImage src={user.image ?? undefined} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grow">
                        <CardTitle className="text-3xl text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            {user.username}
                            {user.pronouns && (
                                <span className="text-lg font-normal text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson/80 ml-2">
                                    ({user.pronouns})
                                </span>
                            )}
                            <FlairIcon tier={user.supporterTier} />
                        </CardTitle>
                        <CardDescription className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-cimo-crimson/80 ">
                            Joined on {new Date(user.createdAt).toLocaleDateString()}
                        </CardDescription>
                        {user.statusMessage && (
                            <div className="mt-2 flex items-center gap-2 rounded-full border border-pompaca-purple/30 bg-dusk-purple/20 hallowsnight:bg-abyss/80 px-3 py-1 w-fit">
                                <span>{user.statusEmoji}</span>
                                <p className="text-sm text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                    {user.statusMessage}
                                </p>
                            </div>
                        )}
                    </div>
                    {session?.user?.id && session.user.id !== user.id && (
                        <div className="self-start sm:self-center flex flex-col gap-2 w-full sm:w-auto">
                            <FriendshipButton
                                profileUserId={user.id}
                                sessionUserId={session.user.id}
                                initialStatus={friendship?.status ?? null}
                                actionUserId={friendship?.actionUserId ?? null}
                            />
                            <MessageUserButton profileUserId={user.id} />
                            <ReportUserButton
                                reportedUserId={user.id}
                                reportedUsername={user.username}
                            />
                        </div>
                    )}
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
                                className="text-sm font-semibold text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine hover:underline"
                            >
                                View TFO Lab
                            </a>
                        )}
                    </div>
                    {user.bio && (
                        <div className="mt-4 border p-3 rounded-md bg-dusk-purple text-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss border-pompaca-purple/30 drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900 z-10">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                Bio
                            </h2>
                            <p className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-cimo-crimson whitespace-pre-wrap">
                                {user.bio}
                            </p>
                        </div>
                    )}

                    {stats && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                                Statistics
                            </h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                <Card className="bg-dusk-purple/20 hallowsnight:bg-abyss p-4">
                                    <p className="text-xl font-bold">{stats.totalCreatures}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson">
                                        Total Creatures
                                    </p>
                                </Card>
                                <Card className="bg-dusk-purple/20 hallowsnight:bg-abyss p-4">
                                    <p className="text-xl font-bold">{stats.totalSyncedSpecies}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson">
                                        Total Species
                                    </p>
                                </Card>
                                <Card className="bg-dusk-purple/20 hallowsnight:bg-abyss p-4">
                                    <p className="text-xl font-bold">{stats.mostNumerousSpecies}</p>
                                    <p className="text-md text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson">
                                        Most Numerous Species
                                    </p>
                                </Card>
                                {stats.achievedGoalsCount > 0 ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Card className="bg-dusk-purple/20 p-4 cursor-pointer hover:bg-dusk-purple/30 transition-colors hallowsnight:bg-abyss">
                                                <p className="text-xl font-bold">
                                                    {stats.achievedGoalsCount}
                                                </p>
                                                <p className="text-md text-dusk-purple dark:text-purple-400 hallowsnight:text-cimo-crimson">
                                                    Goals Achieved
                                                </p>
                                            </Card>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">
                                                        Achieved Goals
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        A list of all research goals this user has
                                                        completed.
                                                    </p>
                                                </div>
                                                <ScrollArea className="h-40">
                                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                                        {stats.achievedGoalNames?.map(
                                                            (name: string, i: number) => (
                                                                <li key={i}>{name}</li>
                                                            )
                                                        )}
                                                    </ul>
                                                </ScrollArea>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <Card className="bg-dusk-purple/20 p-4 hallowsnight:bg-abyss">
                                        <p className="text-xl font-bold">
                                            {stats.achievedGoalsCount}
                                        </p>
                                        <p className="text-md text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                                            Goals Achieved
                                        </p>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    {featuredCreatures.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                                Featured Creatures
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {featuredCreatures.map((creature: EnrichedCreature) => (
                                    <FeaturedCreatureCard
                                        key={creature!.id}
                                        creature={creature}
                                        currentUser={user as any}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {featuredGoals.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                                Featured Research Goals
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {featuredGoals.map((goal: DbResearchGoal) => (
                                    <FeaturedGoalCard
                                        key={goal.id}
                                        goal={goal as any}
                                        achievement={achievedGoalsByGoalId[goal.id]}
                                        username={user.username}
                                        progress={goalProgress[goal.id]}
                                        currentUser={
                                            session?.user?.id === user.id ? (user as any) : null
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {friends && friends.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                                Friends ({friends.length})
                            </h2>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                                {friends.map(
                                    (friend: { id: string; username: string; image: string }) => (
                                        <Link href={`/${friend.username}`} key={friend.id}>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Avatar className="h-16 w-16 hover:ring-2 hover:ring-pompaca-purple dark:hover:ring-purple-300 transition-all">
                                                            <AvatarImage
                                                                src={friend.image ?? undefined}
                                                                alt={friend.username}
                                                            />
                                                            <AvatarFallback>
                                                                {friend.username
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{friend.username}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </Link>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {achievements && achievements.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson mb-4">
                                Achievements
                            </h2>
                            <div>
                                {console.log(achievements)}
                                {achievements.map((ach: any) => (
                                    <TooltipProvider key={ach.id}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="text-center items-center object-top flex-col w-16 h-16 rounded-md bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:bg-abyss hallowsnight:text-blood-bay-wine">
                                                    <img
                                                        src={
                                                            '/images/achievements/' +
                                                            ach.achievementId +
                                                            '.png'
                                                        }
                                                        alt={ach.name}
                                                        className="rounded-md object-none object-center justify-items-center w-16 h-16"
                                                    />
                                                    <div className="text-xs wrap-normal">
                                                        {ach.name}
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-ebena-lavender dark:bg-midnight-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:bg-abyss hallowsnight:text-blood-bay-wine">
                                                <p className="font-bold">{ach.name}</p>
                                                <p className="text-sm">{ach.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Achieved:{' '}
                                                    {new Date(ach.achievedAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Art by {ach.artist}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
