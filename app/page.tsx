import { getHomepageStats } from '@/lib/data';
import { HomePageClient } from './home/page-client';
import { db } from '@/src/db';
import { and, isNotNull, sql } from 'drizzle-orm';
import { breedingPairs } from '@/src/db/schema';
import { enrichAndSerializeCreature } from '@/lib/client-serialization';
import { calculateAllPossibleOutcomes } from '@/lib/genetics';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';

async function getRandomCreature() {
    let randomCreature = null;
    const randomPair = await db.query.breedingPairs.findFirst({
        orderBy: sql`RANDOM()`,
        where: and(
            isNotNull(breedingPairs.maleParentCode),
            isNotNull(breedingPairs.femaleParentCode)
        ),
        with: { maleParent: true, femaleParent: true },
    });

    if (randomPair && randomPair.maleParent && randomPair.femaleParent) {
        const maleParentEnriched = enrichAndSerializeCreature(randomPair.maleParent);
        const femaleParentEnriched = enrichAndSerializeCreature(randomPair.femaleParent);
        const outcomesByCategory = calculateAllPossibleOutcomes(
            maleParentEnriched,
            femaleParentEnriched
        );
        const selectedGenes: { [category: string]: { genotype: string; phenotype: string } } = {};
        for (const category in outcomesByCategory) {
            const outcomes = outcomesByCategory[category];
            let rand = Math.random();
            let chosenOutcome = outcomes[outcomes.length - 1];
            for (const outcome of outcomes) {
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
        };
        return randomCreature;
    } else {
        return null;
    }
}

export const dynamic = 'force-dynamic';

export default async function Page() {
    const stats = await getHomepageStats();
    stats.randomCreature = await getRandomCreature();
    return <HomePageClient stats={stats} />;
}
