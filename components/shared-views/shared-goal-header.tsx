import type { EnrichedResearchGoal } from '@/types';
import { Badge } from '@/components/ui/badge';
import { InfoDisplay } from '@/components/misc-custom-components/info-display';
import { Info } from 'lucide-react';

type Props = {
    goal: EnrichedResearchGoal;
};

export function SharedGoalHeader({ goal }: Props) {
    const goalModeInfoContent = (
        <div className="p-2 max-w-xs text-barely-lilac">
            <h4 className="font-bold mb-2 border-b pb-1">Goal Modes</h4>
            <div className="space-y-3 mt-2">
                <div>
                    <p className="font-semibold">🧬 Genotype Mode</p>
                    <p className="text-sm">
                        Calculates odds for achieving an exact genetic code. Match scores will be
                        much lower. For advanced users aiming for specific breeding outcomes.
                    </p>
                </div>
                <div>
                    <p className="font-semibold">🪶 Phenotype Mode</p>
                    <p className="text-sm">
                        Calculates odds based on achieving a desired look (e.g., &#34;Steppes&#34;),
                        accepting any genotype that produces it. Match scores will be higher and
                        &#34;possible&#34; goals more common. Recommended for most users.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="text-4xl font-bold text-pompaca-purple dark:text-purple-300">
                Goal: {goal.name}
            </h1>
            <div className="mt-5">
                <Badge
                    className={
                        goal.goalMode === 'genotype'
                            ? 'h-auto p-2 capitalize text-center text-sm drop-shadow-md bg-dna-magenta/60 rounded-md border-2 border-pompaca-purple w-fit'
                            : 'h-auto p-2 capitalize text-center text-sm drop-shadow-md bg-dna-teal/60 rounded-md border-2 border-pompaca-purple w-fit'
                    }
                >
                    <span>{goal.goalMode === 'genotype' ? '🧬 Genotype' : '🪶 Phenotype'}</span>
                </Badge>
                <InfoDisplay
                    trigger={
                        <Info className="h-5 w-5 dark:text-purple-300 text-pompaca-purple cursor-pointer ml-2" />
                    }
                    content={goalModeInfoContent}
                />
            </div>
        </div>
    );
}
