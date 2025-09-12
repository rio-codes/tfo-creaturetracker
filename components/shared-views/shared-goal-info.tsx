import type { EnrichedResearchGoal } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
    goal: EnrichedResearchGoal;
};

export function SharedGoalInfo({ goal }: Props) {
    const geneEntries = goal.genes ? Object.entries(goal.genes) : [];
    const gender = goal.genes['Gender']?.phenotype;

    return (
        <Card className="md:col-span-2 bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 border-border">
            <CardContent className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="text-lg font-semibold">
                        <span>Species:</span>{' '}
                        <span className="text-lg font-normal">
                            {goal.species}
                        </span>
                    </div>
                    <div className="text-lg font-semibold">
                        Gender:
                        <span className="text-lg font-normal"> {gender}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 dark:border-purple-400/50 pb-1">
                            Genotype
                        </h3>
                        <div className="space-y-1 text-sm">
                            {geneEntries
                                .filter(([category]) => category !== 'Gender')
                                .map(([category, gene]) => (
                                    <div key={category} className={gene.isOptional ? 'opacity-70' : ''}>
                                        <strong>
                                            {category}{gene.isOptional && ' (Optional)'}:
                                        </strong>{' '}
                                        {gene.genotype}
                                    </div>
                                ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2 border-b border-pompaca-purple/50 dark:border-purple-400/50 pb-1">
                            Phenotype
                        </h3>
                        <div className="space-y-1 text-sm">
                            {geneEntries
                                .filter(([category]) => category !== 'Gender')
                                .map(([category, gene]) => (
                                    <div key={category} className={gene.isOptional ? 'opacity-70' : ''}>
                                        <strong>
                                            {category}{gene.isOptional && ' (Optional)'}:
                                        </strong>{' '}
                                        {gene.phenotype}
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
