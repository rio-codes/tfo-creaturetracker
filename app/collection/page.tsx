
import { getCreaturesForUser } from '@/app/lib/data'
import { CollectionClient } from '@/components/collection-client';

export default async function CollectionPage() {
  const creatures = await getCreaturesForUser();
  const serializableCreatures = creatures.map(creature => ({
    ...creature,
    // Use .toISOString() to convert Dates to a standard string format
    gottenAt: creature.gottenAt ? creature.gottenAt.toISOString() : null,
    createdAt: creature.createdAt.toISOString(),
    updatedAt: creature.updatedAt.toISOString(),
  }));

  return (
    <div className="bg-barely-lilac min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-pompaca-purple mb-8">Collection</h1>
        <CollectionClient initialCreatures={serializableCreatures} />
      </div>
    </div>
  );
}