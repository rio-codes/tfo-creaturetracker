import { Suspense } from 'react';
import { WishlistClient } from '@/components/custom-clients/wishlist-client';
import { getAllEnrichedCreaturesForUser, fetchFilteredWishlistGoals } from '@/lib/data';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

export default async function WishlistPage(props: {
    searchParams?: {
        page?: string;
        query?: string;
        showMatches?: string;
        isSeasonal?: string;
        species?: string;
        generation?: string;
        geneCategory?: string;
        geneQuery?: string;
        sortBy?: string;
    };
}) {
    const searchParams = props.searchParams || {};
    const session = await auth();

    // Fetch all data in parallel
    const [{ pinnedWishlistGoals, unpinnedWishlistGoals, totalPages }, userCreatures, currentUser] =
        await Promise.all([
            fetchFilteredWishlistGoals(searchParams),
            getAllEnrichedCreaturesForUser(),
            session?.user?.id
                ? (db.query.users.findFirst({
                      where: eq(users.id, session.user.id),
                      columns: { password: false },
                  }) as Promise<User | undefined>)
                : Promise.resolve(undefined),
        ]);

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-4">Community Wishlist</h1>
                <p className="text-lg text-barely-lilac dark:text-purple-400 hallowsnight:text-cimo-crimson mb-8">
                    Browse public research goals from other users. Maybe you have just what
                    they&#39;re looking for!
                </p>
                <Suspense fallback={<div>Loading wishlist...</div>}>
                    <WishlistClient
                        pinnedGoals={pinnedWishlistGoals}
                        unpinnedGoals={unpinnedWishlistGoals}
                        totalPages={totalPages}
                        userCreatures={userCreatures}
                        currentUser={currentUser ?? null}
                    />
                </Suspense>
            </div>
        </div>
    );
}
