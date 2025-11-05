'use client';

import { ChecklistCard } from '@/components/custom-cards/checklist-card';
import { CreateChecklistDialog } from '@/components/custom-dialogs/create-checklist-dialog';
import { Target } from 'lucide-react';
import type { EnrichedChecklist } from '@/types';

type ChecklistsClientProps = {
    checklists: EnrichedChecklist[];
};

export function ChecklistsClient({ checklists }: ChecklistsClientProps) {
    return (
        <div className="min-h-screen bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-midnight-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">My Checklists</h1>
                        <p className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson/80 mt-2 text-lg">
                            Track your progress on your personal collection goals.
                        </p>
                    </div>
                    <CreateChecklistDialog />
                </header>

                <main>
                    {checklists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {checklists.map((checklist) => (
                                <ChecklistCard key={checklist.id} checklist={checklist} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-pompaca-purple/30 dark:border-purple-400/30 hallowsnight:border-cimo-crimson/30 rounded-lg">
                            <Target className="mx-auto h-12 w-12 text-pompaca-purple/50 dark:text-purple-400/50 hallowsnight:text-cimo-crimson/50" />
                            <h3 className="mt-4 text-lg font-semibold">No Checklists Yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Get started by creating your first checklist.
                            </p>
                            <div className="mt-6">
                                <CreateChecklistDialog />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
