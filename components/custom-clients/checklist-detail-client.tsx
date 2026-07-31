'use client';

import { ChecklistGrid } from '@/components/custom-views/checklist-grid';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EnrichedChecklist, EnrichedCreature } from '@/types';

type ChecklistDetailClientProps = {
    checklist: EnrichedChecklist;
    allCreatures: EnrichedCreature[];
    isOwner: boolean;
};

export function ChecklistDetailClient({
    checklist,
    allCreatures,
    isOwner,
}: ChecklistDetailClientProps) {
    const percentage =
        checklist.progress.total > 0
            ? (checklist.progress.filled / checklist.progress.total) * 100
            : 0;
    const isCompleted = checklist.progress.filled === checklist.progress.total && checklist.progress.total > 0;

    return (
        <div className="min-h-screen bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-midnight-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{checklist.name}</h1>
                        {isCompleted && (
                            <Badge className="bg-emerald-600 text-white font-bold px-3 py-1 text-sm flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Complete!
                            </Badge>
                        )}
                    </div>
                    <p className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson/80 mt-2 text-lg">
                        A checklist for the {checklist.species} species.
                    </p>
                    <div className="mt-4 max-w-lg">
                        <div className="flex justify-between w-full text-sm text-muted-foreground mb-1">
                            <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                Progress
                            </span>
                            <span>
                                {checklist.progress.filled} / {checklist.progress.total}
                            </span>
                        </div>
                        <Progress value={percentage} className="w-full" />
                    </div>
                </header>

                <main>
                    <ChecklistGrid
                        checklist={checklist}
                        allCreatures={allCreatures}
                        isOwner={isOwner}
                    />
                </main>
            </div>
        </div>
    );
}
