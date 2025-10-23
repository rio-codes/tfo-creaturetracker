import { Suspense } from 'react';
import { WishlistClient } from '@/components/custom-clients/wishlist-client';
import { getAllEnrichedCreaturesForUser } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function WishlistPage(props: {
    searchParams?: {
        query?: string;
        species?: string;
        isSeasonal?: string;
        showMatches?: string;
    };
}) {
    const searchParams = await props.searchParams;
    const userCreatures = await getAllEnrichedCreaturesForUser();

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-4">Community Wishlist</h1>
                <p className="text-lg text-barely-lilac dark:text-purple-400 hallowsnight:text-cimo-crimson mb-8">
                    Browse public research goals from other users. Maybe you have just what they're
                    looking for!
                </p>
                <Suspense fallback={<div>Loading wishlist...</div>}>
                    <WishlistClient searchParams={searchParams} userCreatures={userCreatures} />
                </Suspense>
            </div>
        </div>
    );
}
