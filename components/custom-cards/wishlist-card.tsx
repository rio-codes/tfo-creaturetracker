'use client';

import Image from 'next/image';
import Link from 'next/link';
// import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import type { EnrichedResearchGoal } from '@/types';
import { MessageUserButton } from '@/components/custom-buttons/message-user-button';
import { FindWishlistPairsDialog } from '@/components/custom-dialogs/find-wishlist-pairs-dialog';

interface WishlistCardProps {
    wish: {
        goal: EnrichedResearchGoal;
        owner: { username: string | null; id: string; allowWishlistGoalSaving: boolean };
    };
    matchingCreatureId?: string | null;
}

export function WishlistCard({ wish, matchingCreatureId }: WishlistCardProps) {
    const { goal, owner } = wish;
    return (
        <Card className="relative bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet hallowsnight:text-cimo-crimson text-pompaca-purple dark:text-barely-lilac p-4 flex flex-col gap-4">
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
                <FindWishlistPairsDialog goal={goal} owner={owner}>
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
