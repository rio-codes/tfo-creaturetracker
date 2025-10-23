'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Info } from 'lucide-react';
import type { EnrichedResearchGoal } from '@/types';

interface WishlistCardProps {
    wish: {
        goal: EnrichedResearchGoal;
        owner: { username: string | null; id: string };
    };
    matchingCreatureId?: string | null;
}

export function WishlistCard({ wish, matchingCreatureId }: WishlistCardProps) {
    const { goal, owner } = wish;

    const prefilledSubject = `I have a creature matching "${goal.name}"`;
    const prefilledBody = `Hello ${owner.username},\n\nI saw your research goal "${
        goal.name
    }" on the Community Wishlist and I have a creature that might be a perfect match!\n\n[creature:]\n\nLet me know if you're interested in a trade.`;

    const mailtoLink = `mailto:${owner.username}@tfo.creaturetracker.net?subject=${encodeURIComponent(
        prefilledSubject
    )}&body=${encodeURIComponent(prefilledBody)}`;

    return (
        <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet hallowsnight:text-cimo-crimson text-pompaca-purple p-4 gap-4 items-center">
            <Image
                src={goal.imageUrl || '/images/misc/placeholder.png'}
                alt={goal.name}
                width={80}
                height={80}
                className="rounded-md bg-white/10 p-1 object-contain"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-dusk-purple dark:text-purple-400">
                    Goal by{' '}
                    <Link href={`/${owner.username}`} className="font-semibold hover:underline">
                        {owner.username}
                    </Link>
                </p>
                <h3 className="font-bold truncate" title={goal.name}>
                    {goal.name}
                </h3>
                <p className="text-sm text-dusk-purple dark:text-purple-400 truncate">
                    {goal.species}
                </p>
                {matchingCreatureId && (
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1">
                        You have a matching creature!
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <Link href={`/share/goals/${goal.id}`} passHref>
                    <Button size="sm" variant="outline" className="w-full">
                        <Info className="mr-2 h-4 w-4" />
                        Details
                    </Button>
                </Link>
                {matchingCreatureId ? (
                    <a href={mailtoLink}>
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Message
                        </Button>
                    </a>
                ) : (
                    <Button size="sm" disabled variant="secondary" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Message
                    </Button>
                )}
            </div>
        </Card>
    );
}
