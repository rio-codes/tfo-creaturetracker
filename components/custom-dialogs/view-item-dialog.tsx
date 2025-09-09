'use client';

import { useState, useEffect, Suspense } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CreatureCard } from '@/components/custom-cards/creature-card';
import { BreedingPairCard } from '@/components/custom-cards/breeding-pair-card';
import { ResearchGoalCard } from '@/components/custom-cards/research-goal-card';
import { Loader2 } from 'lucide-react';

export function ViewItemDialog({
    item,
    onClose,
}: {
    item: { type: string; id: string } | null;
    onClose: () => void;
}) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!item) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/admin/${item.type}s/${item.id}`);
                if (!res.ok) throw new Error('Failed to fetch item details');
                const result = await res.json();
                setData(result);
            } catch (error) {
                console.error(error);
                // You could add a toast notification here for the user
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [item]);

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
            setData(null); // Reset data on close
        }
    };

    const renderCard = () => {
        if (!data) return null;

        switch (item?.type) {
            case 'creature':
                return <CreatureCard {...data} isAdminView={true} />;
            case 'breeding-pair':
                return <BreedingPairCard {...data} isAdminView={true} />;
            case 'research-goal':
                return (
                    <ResearchGoalCard
                        goal={data.enrichedGoal}
                        isAdminView={true}
                    />
                );
            default:
                return <div>Unsupported item type</div>;
        }
    };

    return (
        <Dialog open={!!item} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl bg-barely-lilac dark:bg-deep-purple border-pompaca-purple/50">
                <DialogHeader>
                    <DialogTitle className="capitalize text-pompaca-purple dark:text-purple-300">
                        View {item?.type}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4 min-h-[300px] flex items-center justify-center">
                    {isLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <Suspense>{renderCard()}</Suspense>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
