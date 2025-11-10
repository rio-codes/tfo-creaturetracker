import { getHomepageStats } from '@/lib/data';
import { HomePageClient } from './home/page-client';
import { db } from '@/src/db';
import { and, isNotNull, sql } from 'drizzle-orm';
import { breedingPairs } from '@/src/db/schema';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { calculateBreedingOutcomes } from '@/lib/genetics';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';
import { unstable_cache as cache } from 'next/cache';

const getRandomCreature = cache(
    async () => {
        let randomCreature = null;
        const randomPair = await db.query.breedingPairs.findFirst({
            orderBy: sql`RANDOM()`,
            where: and(
                isNotNull(breedingPairs.maleParentCode),
                isNotNull(breedingPairs.femaleParentCode)
            ),
            with: { maleParent: true, femaleParent: true, user: true },
        });

        if (randomPair && randomPair.maleParent && randomPair.femaleParent && randomPair.user) {
            const maleParentEnriched = enrichAndSerializeCreature(randomPair.maleParent);
            const femaleParentEnriched = enrichAndSerializeCreature(randomPair.femaleParent);
            const outcomesByCategory = calculateBreedingOutcomes(
                maleParentEnriched,
                femaleParentEnriched
            );
            const selectedGenes: { [category: string]: { genotype: string; phenotype: string } } =
                {};

            // Assuming we only care about the first possible species outcome for the random creature.
            const firstSpeciesOutcome = outcomesByCategory[0];

            if (firstSpeciesOutcome) {
                for (const category in firstSpeciesOutcome.geneOutcomes) {
                    const geneOutcomesForCategory = firstSpeciesOutcome.geneOutcomes[category];
                    let rand = Math.random();
                    let chosenOutcome: any =
                        geneOutcomesForCategory[geneOutcomesForCategory.length - 1];
                    for (const outcome of geneOutcomesForCategory) {
                        if (rand < outcome.probability) {
                            chosenOutcome = outcome;
                            break;
                        }
                        rand -= outcome.probability;
                    }
                    selectedGenes[category] = {
                        genotype: chosenOutcome.genotype,
                        phenotype: chosenOutcome.phenotype,
                    };
                }
            }
            const selectedGenotypes = Object.fromEntries(
                Object.entries(selectedGenes).map(([cat, gene]) => [cat, gene.genotype])
            );
            let imageUrl: string | null = null;
            try {
                const tfoImageUrl = constructTfoImageUrl(randomPair.species, selectedGenotypes);
                const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
                imageUrl = await fetchAndUploadWithRetry(
                    bustedTfoImageUrl,
                    `admin-preview-${randomPair.id}-${Date.now()}`,
                    3
                );
            } catch (error) {
                console.error('Failed to generate preview image for admin metrics:', error);
            }
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let randomCode = '';
            for (let i = 0; i < 5; i++) {
                randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            randomCreature = {
                image: imageUrl,
                species: randomPair.species,
                code: randomCode,
                genes: selectedGenes,
                pairName: randomPair.pairName,
                ownerUsername: randomPair.user.username,
            };
            return randomCreature;
        } else {
            return null;
        }
    },
    ['random-creature-spotlight'],
    { revalidate: 28800 } // 8 hours in seconds
);

export const dynamic = 'force-dynamic';

export default async function Page() {
    const stats: any = await getHomepageStats();
    stats.randomCreature = await getRandomCreature();
    return <HomePageClient stats={stats} />;
}
