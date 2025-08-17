
import { getCreaturesForUser } from '@/app/lib/data'
import { CollectionClient } from '@/components/collection-client';
import type { Creature } from '@/types';

export default async function CollectionPage() {
  const creatures = await getCreaturesForUser();
  console.log(creatures)

  return (
    <div className="bg-barely-lilac min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-pompaca-purple mb-8">Collection</h1>
        <CollectionClient initialCreatures={creatures} />
      </div>
    </div>
  );
}