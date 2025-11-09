'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Archive, Trash2, Check, PartyPopper } from 'lucide-react';
import type { EnrichedCreature, EnrichedResearchGoal } from '@/types';

type AnalysisResult = {
    matchingGoals: { goal: EnrichedResearchGoal; matchingCreature: EnrichedCreature }[];
    archivableCreatures: { id: string; code: string; creatureName: string | null }[];
};

type PostSyncAnalysisProps = {
    results: AnalysisResult;
    onComplete: () => void;
};

export function PostSyncAnalysis({ results, onComplete }: PostSyncAnalysisProps) {
    const router = useRouter();
    const { width, height } = useWindowSize();
    const [isLoading, setIsLoading] = useState(false);
    const [currentResults, setCurrentResults] = useState<AnalysisResult>(results);
    const [showConfetti, _setShowConfetti] = useState(
        results.matchingGoals.length > 0 ? true : false
    );

    const handleMarkAchieved = async (goalId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/research-goals/${goalId}/achieve`, {
                method: 'PATCH',
            });
            if (!response.ok) throw new Error('Failed to mark goal as achieved.');
            toast.success('Goal marked as achieved!');
            router.refresh();
            const newResults = {
                ...currentResults,
                matchingGoals: currentResults.matchingGoals.filter(
                    (match) => match.goal.id !== goalId
                ),
            };
            setCurrentResults(newResults);
            if (
                newResults.matchingGoals.length === 0 &&
                newResults.archivableCreatures.length === 0
            ) {
                onComplete();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/research-goals/${goalId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete goal.');
            toast.success('Goal deleted!');
            router.refresh();
            onComplete();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // In post-sync-analysis.tsx

    const handleArchiveCreatures = async () => {
        setIsLoading(true);
        const creatureIds = currentResults.archivableCreatures.map((c) => c.id);
        try {
            const response = await fetch('/api/creatures/archive-many', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatureIds }),
            });
            if (!response.ok) throw new Error('Failed to archive creatures.');
            toast.success(`${creatureIds.length} creatures archived.`);
            router.refresh();

            const newResults = {
                ...currentResults,
                archivableCreatures: [],
            };
            setCurrentResults(newResults);

            if (
                newResults.matchingGoals.length === 0 &&
                newResults.archivableCreatures.length === 0
            ) {
                onComplete();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 space-y-6 overflow-y-auto max-h-[70vh]">
            {showConfetti && <Confetti width={width} height={height} recycle={false} />}

            {results.matchingGoals.length > 0 && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-3 mb-4">
                        <PartyPopper className="h-8 w-8 text-green-500" />
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                            Congratulations!
                        </h3>
                    </div>
                    <p className="mb-4 text-green-700 dark:text-green-400">
                        You've synced creatures that match your research goals!
                    </p>
                    <div className="space-y-3">
                        {results.matchingGoals.map(({ goal, matchingCreature }) => (
                            <div
                                key={goal.id}
                                // Add flex-col and md:flex-row to this container
                                className="p-3 rounded-md bg-white dark:bg-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2"
                            >
                                <div>
                                    <p className="font-semibold">{goal.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Matched by: {matchingCreature?.creatureName} (
                                        {matchingCreature?.code})
                                    </p>
                                </div>
                                {/* Change this div to be responsive */}
                                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        disabled={isLoading}
                                        className="w-full" // Make button full width on mobile
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Goal
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleMarkAchieved(goal.id)}
                                        disabled={isLoading}
                                        className="bg-green-600 hover:bg-green-700 w-full" // Make button full width on mobile
                                    >
                                        <Check className="mr-2 h-4 w-4" /> Mark Achieved
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results.archivableCreatures.length > 0 && (
                <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Archive Missing Creatures?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        The following {results.archivableCreatures.length} creatures were not found
                        in your synced tabs. Would you like to archive them?
                    </p>
                    <ScrollArea className="h-32 mb-4 rounded-md border bg-slate-50 dark:bg-slate-800/50 p-2">
                        <ul className="text-xs list-disc list-inside">
                            {results.archivableCreatures.map((c) => (
                                <li key={c.id}>
                                    {c.creatureName || 'Unnamed'} ({c.code})
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={onComplete} disabled={isLoading}>
                            No, Keep Them
                        </Button>
                        <Button onClick={handleArchiveCreatures} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Archive className="mr-2 h-4 w-4" />
                            )}
                            Yes, Archive Them
                        </Button>
                    </div>
                </div>
            )}

            {results.matchingGoals.length === 0 && results.archivableCreatures.length === 0 && (
                <div className="text-center p-8">
                    <p className="text-slate-500 dark:text-slate-400">
                        Sync complete. No new goal matches or archivable creatures found.
                    </p>
                    <Button onClick={onComplete} className="mt-4">
                        Finish
                    </Button>
                </div>
            )}
        </div>
    );
}
