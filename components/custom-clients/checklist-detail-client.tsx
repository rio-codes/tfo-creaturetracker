'use client';

import { ChecklistGrid } from '@/components/custom-views/checklist-grid';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-midnight-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold">{checklist.name}</h1>
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
