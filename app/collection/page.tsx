import { CollectionClient } from '@/components/custom-clients/collection-client';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/types';
import { fetchFilteredCreatures } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CollectionPage(props: {
    searchParams?: Promise<{
        page?: string;
        query?: string;
        stage?: string;
        gender?: string;
        species?: string;
        showArchived?: string;
        generation?: string;
        origin?: string;
        geneCategory?: string;
        geneQuery?: string;
        geneMode?: 'phenotype' | 'genotype';
    }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const plainSearchParams = {
        page: searchParams?.page,
        query: searchParams?.query,
        stage: searchParams?.stage,
        gender: searchParams?.gender,
        species: searchParams?.species,
        showArchived: searchParams?.showArchived,
        generation: searchParams?.generation,
        origin: searchParams?.origin,
        geneCategory: searchParams?.geneCategory,
        geneQuery: searchParams?.geneQuery,
        geneMode: searchParams?.geneMode,
    };
    const filteredData = await fetchFilteredCreatures(plainSearchParams);

    const [currentUser] = await Promise.all([
        session?.user?.id
            ? (db.query.users.findFirst({
                  where: eq(users.id, session.user.id),
                  columns: { password: false },
              }) as Promise<User | undefined>)
            : Promise.resolve(undefined),
    ]);

    const { pinnedCreatures, unpinnedCreatures, totalPages } = filteredData || {
        pinnedCreatures: [],
        unpinnedCreatures: [],
        totalPages: 0,
    };

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss min-h-screen inset-shadow-sm inset-shadow-gray-700">
            <div className="container mx-auto px-4 py-8">
                <Suspense fallback={<div>Loading collection...</div>}>
                    <CollectionClient
                        totalPages={totalPages}
                        pinnedCreatures={pinnedCreatures || []}
                        unpinnedCreatures={unpinnedCreatures || []}
                        searchParams={plainSearchParams}
                        currentUser={currentUser ?? null}
                    />
                </Suspense>
            </div>
        </div>
    );
}
