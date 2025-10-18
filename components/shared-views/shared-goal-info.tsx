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

type SharedGoalInfoProps = {
    goal: EnrichedResearchGoal;
};

export function SharedGoalInfo({ goal }: SharedGoalInfoProps) {
    const geneEntries = goal?.genes ? Object.entries(goal.genes) : [];
    const gender = goal?.genes['Gender']?.phenotype;

    return (
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
                                                <span className="text-xs"> (Opt.)</span>
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
    );
}
