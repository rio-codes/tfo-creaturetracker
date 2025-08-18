import { getCreaturesForUser } from '@/app/lib/data';
import { CollectionClient } from '@/components/collection-client';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function CollectionPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    query?: string;
    stage?: string;
    species?: string; 
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const query = searchParams?.query;
  const stage = searchParams?.stage;
  const species = searchParams?.species;

  const { creatures, totalPages } = await getCreaturesForUser(
    currentPage, 
    query,
    undefined, // placeholder for genders filter
    stage,
    species
  );

  return (
    <div className="bg-barely-lilac min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading collection...</div>}>
            <CollectionClient 
              initialCreatures={creatures} 
              totalPages={totalPages}
            />
        </Suspense>
      </div>
    </div>
  );
}