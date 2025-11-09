import type { EnrichedResearchGoal } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Award } from 'lucide-react';

type SharedGoalInfoProps = {
    goal: EnrichedResearchGoal;
};

export function SharedGoalInfo({ goal }: SharedGoalInfoProps) {
    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];
    const gender = goal?.genes['Gender']?.phenotype;

    return (
        <>
            {goal.isAchieved && (
                <div className="p-4 mb-6 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center gap-4">
                    <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div>
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                            Goal Achieved!
                        </h3>
                        <p className="text-green-700 dark:text-green-300">
                            This research goal has been completed.
                        </p>
                    </div>
                </div>
            )}
            <Card className="md:col-span-2 bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson border-border">
                <CardContent className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-lg font-semibold">
                            <span>Species:</span>{' '}
                            <span className="text-lg font-normal">{goal?.species}</span>
                        </div>
                        <div className="text-lg font-semibold">
                            Gender:
                            <span className="text-lg font-normal"> {gender}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-0">
                                    <TableHead className="text-lg">Trait</TableHead>
                                    <TableHead className="text-lg">Phenotype</TableHead>
                                    <TableHead className="text-lg">Genotype</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {geneEntries
                                    .filter(([category]) => category !== 'Gender')
                                    .map(([category, gene], index) => (
                                        <TableRow
                                            key={category}
                                            className={`${index % 2 === 0 ? 'bg-black/5 dark:bg-white/5' : ''} ${gene.isOptional ? 'opacity-70' : ''} border-b-0`}
                                        >
                                            <TableCell className="font-medium">
                                                {category}
                                                {gene.isOptional && (
                                                    <>
                                                        <span className="text-xs"> (Opt.)</span>
                                                        {goal.excludedGenes?.[category] && (
                                                            <p className="text-xs text-red-500">
                                                                Ex:{' '}
                                                                {goal.excludedGenes[
                                                                    category
                                                                ].phenotype.join(', ')}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </TableCell>
                                            <TableCell>{gene.phenotype}</TableCell>
                                            <TableCell>{gene.genotype}</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
