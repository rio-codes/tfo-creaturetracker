import { getCreaturesForUser } from '@/app/lib/data';
import { CollectionClient } from '@/components/collection-client';
import { Suspense } from 'react';

// The page component now receives searchParams as a prop from Next.js
export default async function CollectionPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    // You can add other filters like 'query' here later
  };
}) {
  // Get the current page from the URL, or default to 1
  const currentPage = Number(searchParams?.page) || 1;

  // Fetch only the data for the current page from the server
  const { creatures, totalPages } = await getCreaturesForUser(currentPage);

  return (
    <div className="bg-barely-lilac min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-pompaca-purple mb-8">Collection</h1>
        
        {/*
          Wrap the client component in a Suspense boundary.
          This is good practice for components that use searchParams.
        */}
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