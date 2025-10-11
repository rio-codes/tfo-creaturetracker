'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { ManageBreedingPairsForm } from '@/components/custom-forms/manage-breeding-pairs-form';
import type {
    EnrichedCreature,
    EnrichedResearchGoal,
    EnrichedBreedingPair,
    DbBreedingPair,
    DbBreedingLogEntry,
} from '@/types';

type ManageBreedingPairsDialogProps = {
    baseCreature: EnrichedCreature;
    children: React.ReactNode;
};

type BreedingData = {
    allCreatures: EnrichedCreature[];
    allPairs: EnrichedBreedingPair[];
    allGoals: EnrichedResearchGoal[];
    allRawPairs: DbBreedingPair[];
    allLogs: DbBreedingLogEntry[];
};

export function ManageBreedingPairsDialog({
    baseCreature,
    children,
}: ManageBreedingPairsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<BreedingData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && !data) {
            const fetchData = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const response = await fetch('/api/breeding-management-data');
                    if (!response.ok) {
                        throw new Error('Failed to load breeding data.');
                    }
                    const fetchedData = await response.json();
                    setData(fetchedData);
                } catch (err: any) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, data]);

    // Reset data when dialog closes to ensure fresh data on next open
    useEffect(() => {
        if (!isOpen) {
            setData(null);
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                className="bg-barely-lilac dark:bg-pompaca-purple max-h-2/3 overflow-y-auto [&>button]:hidden"
            >
                <DialogHeader>
                    <DialogTitle className="text-pompaca-purple dark:text-purple-300">
                        Manage Pairs for {baseCreature!.creatureName || baseCreature!.code}
                    </DialogTitle>
                </DialogHeader>
                {isLoading && (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {error && <p className="text-red-500 text-center">{error}</p>}
                {data && (
                    <ManageBreedingPairsForm
                        baseCreature={baseCreature}
                        allCreatures={data.allCreatures}
                        allPairs={data.allPairs}
                        allGoals={data.allGoals}
                        allRawPairs={data.allRawPairs}
                        allLogs={data.allLogs}
                        onActionCompleteAction={() => setIsOpen(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
