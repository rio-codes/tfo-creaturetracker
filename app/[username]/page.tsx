import { notFound } from 'next/navigation';
import { db } from '@/src/db';
import { users, creatures, researchGoals, friendships, achievedGoals } from '@/src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaCrown, FaStar } from 'react-icons/fa';
import { auth } from '@/auth';
import { RESERVED_USER_PATHS } from '@/constants/paths';
import { FriendshipButton } from '@/components/custom-buttons/friendship-button';
import { FeaturedCreatureCard } from '@/components/custom-cards/featured-creature-card';
import { FeaturedGoalCard } from '@/components/custom-cards/featured-goal-card';
import { enrichAndSerializeCreature as enrichCreatures } from '@/lib/serialization';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    DbCreature,
    GoalGene,
    DbResearchGoal,
} from '@/types';

type AchievementMap = {
    [goalId: string]: { creature: DbCreature };
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
        enrichCreatures(creature)
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

    return { user, featuredCreatures, featuredGoals, friendship, achievements };
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
    const { user, featuredCreatures, featuredGoals, friendship, achievements } = data;

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
                            <SupporterIcon tier={user.supporterTier} />
                        </CardTitle>
                        <CardDescription className="text-pompaca-purple dark:text-purple-400">
                            Joined on {new Date(user.createdAt).toLocaleDateString()}
                        </CardDescription>
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
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
