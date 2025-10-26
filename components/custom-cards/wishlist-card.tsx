'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Pin, PinOff } from 'lucide-react';
import type { EnrichedResearchGoal } from '@/types';
import { MessageUserButton } from '@/components/custom-buttons/message-user-button';
import { FindWishlistPairsDialog } from '@/components/custom-dialogs/find-wishlist-pairs-dialog';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WishlistCardProps {
    wish: {
        goal: EnrichedResearchGoal;
        owner: {
            username: string | null | undefined;
            id: string;
            allowWishlistGoalSaving: boolean;
        };
    };
    matchingCreatureId?: string | null;
    isPinned?: boolean;
}

export function WishlistCard({
    wish,
    matchingCreatureId,
    isPinned: isPinnedProp,
}: WishlistCardProps) {
    const { goal, owner } = wish;
    const [isPinned, setIsPinned] = useState(isPinnedProp);
    const [isPinning, setIsPinning] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsPinned(isPinnedProp);
    }, [isPinnedProp]);

    const handlePinToggle = async () => {
        setIsPinning(true);
        const newPinState = !isPinned;
        try {
            const response = await fetch(`/api/research-goals/${goal.id}?action=pin-to-wishlist`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: newPinState }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update pin status.');
            }
            setIsPinned(newPinState);
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(`Could not update pin status: ${error.message}`);
            setIsPinned(!newPinState);
        } finally {
            setIsPinning(false);
        }
    };

    return (
        <Card className="relative bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet hallowsnight:text-cimo-crimson text-pompaca-purple dark:text-barely-lilac p-4 flex flex-col gap-4">
            <div className="absolute top-1 right-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePinToggle}
                    disabled={isPinning}
                    aria-label={isPinned ? 'Unpin goal' : 'Pin goal'}
                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson"
                >
                    {isPinned ? (
                        <Pin className="h-5 w-5 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson fill-pompaca-purple hallowsnight:fill-ruzafolio-scarlet dark:fill-purple-300" />
                    ) : (
                        <PinOff className="h-5 w-5 text-dusk-purple dark:text-purple-400 hallowsnight:text-ruzafolio-scarlet hallowsnight:fill-cimo-crimson dark:fill-purple-400" />
                    )}
                </Button>
            </div>
            <Image
                src={goal.imageUrl || '/images/misc/placeholder.png'}
                alt={goal.name}
                width={80}
                height={80}
                className="rounded-md bg-white/10 p-1 object-contain"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-dusk-purple hallowsnight:text-cimo-crimson dark:text-purple-400">
                    Goal by{' '}
                    <Link href={`/${owner.username}`} className="font-semibold hover:underline">
                        {owner.username}
                    </Link>
                </p>
                <h3
                    className="font-bold truncate hallowsnight:text-blood-bay-wine"
                    title={goal.name}
                >
                    {goal.name}
                </h3>
                <p className="text-sm text-dusk-purple hallowsnight:text-cimo-crimson dark:text-purple-400 truncate">
                    {goal.species}
                </p>
                {matchingCreatureId && (
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                        You have a matching creature!
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-2 mt-auto">
                <Link href={`/share/goals/${goal.id}`} passHref>
                    <Button size="sm" variant="outline" className="w-full">
                        <Info className="mr-2 h-4 w-4" />
                        Details
                    </Button>
                </Link>
                <FindWishlistPairsDialog
                    goal={goal}
                    owner={{
                        username: owner.username,
                        id: owner.id,
                        allowWishlistGoalSaving: owner.allowWishlistGoalSaving,
                    }}
                >
                    <Button size="sm" variant="outline" className="w-full">
                        Can I Breed This?
                    </Button>
                </FindWishlistPairsDialog>
                <MessageUserButton
                    profileUserId={owner.id}
                    prefillMessage={`Hello! I saw your wishlist goal "${goal.name}" and I might have a creature that can help.`}
                />
            </div>
        </Card>
    );
}
