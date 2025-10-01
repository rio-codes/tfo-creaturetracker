'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EnrichedCreature } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ChevronUp, ChevronDown, Loader2, UserRoundMinus, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { User as DbUser } from '@/types';

interface FeaturedCreatureCardProps {
    creature: EnrichedCreature;
    currentUser?: DbUser | null;
}

export function FeaturedCreatureCard({ creature, currentUser }: FeaturedCreatureCardProps) {
    if (!creature) return;
    const [isFeatured, setIsFeatured] = useState(
        currentUser?.featuredCreatureIds?.includes(creature.id) ?? false
    );
    const [isFeaturing, setIsFeaturing] = useState(false);
    const router = useRouter();

    const handleFeatureToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUser) return;
        setIsFeaturing(true);

        const currentFeaturedIds = currentUser.featuredCreatureIds || [];
        const newIsFeatured = !isFeatured;

        const newFeaturedIds = newIsFeatured
            ? [...currentFeaturedIds, creature.id]
            : currentFeaturedIds.filter((id) => id !== creature.id);

        if (newFeaturedIds.length > 3) {
            toast.error('You can only feature up to 3 creatures.');
            setIsFeaturing(false);
            return;
        }

        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featuredCreatureIds: newFeaturedIds }),
            });
            if (!response.ok) throw new Error('Failed to update featured creatures.');
            setIsFeatured(newIsFeatured);
            toast.success(
                newIsFeatured ? 'Creature featured on profile!' : 'Creature un-featured.'
            );
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsFeaturing(false);
        }
    };
    return (
        <Card className="relative h-full transition-transform transform hover:scale-105 hover:shadow-lg  bg-dusk-purple text-barely-lilac dark:bg-midnight-purple border-pompaca-purple/30 flex flex-col drop-shadow-md drop-shadow-gray-500 dark:drop-shadow-gray-900">
            {currentUser && (
                <div className="absolute top-2 right-2 z-10">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleFeatureToggle}
                                    disabled={isFeaturing || creature.isArchived}
                                    className="h-8 w-8 rounded-full hover:bg-pompaca-purple/20"
                                >
                                    {isFeaturing ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : isFeatured ? (
                                        <UserRoundMinus className="h-5 w-5 text-pompaca-purple dark:text-purple-300" />
                                    ) : (
                                        <UserRoundPlus className="h-5 w-5 text-dusk-purple dark:text-purple-400" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {isFeatured ? 'Un-feature from profile' : 'Feature on profile'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}
            <Link
                href={`https://finaloutpost.net/view/${creature.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow flex flex-col"
            >
                <CardContent
                    className="p-4 flex-grow flex flex-col sm:flex-row gap-4 text-pompaca-purple dark:text-barely-lilac min-w-0 overflow-x-clip max-w-9/10
            whitespace-normal"
                >
                    {' '}
                    <img
                        src={creature.imageUrl}
                        alt={creature.creatureName || creature.code}
                        className="h-32 w-32 object-contain rounded-md bg-white/10 p-3 self-center sm:self-start"
                    />
                    <div className="flex-1">
                        <CardTitle
                            className="text-lg text-pompaca-purple dark:text-purple-300"
                            title={creature.creatureName || creature.code}
                        >
                            <span className="text-wrap wrap-normal">
                                {creature.creatureName} {' ('}
                                {creature.code})
                            </span>
                        </CardTitle>
                        <div className="text-sm text-pompaca-purple dark:text-purple-400 mt-2 space-y-1">
                            <p>
                                <strong>Species:</strong> {creature.species}
                            </p>
                            <p>
                                <strong>Gender:</strong> {creature.gender}
                            </p>
                            <p>
                                <strong>Generation:</strong> G{creature.generation}
                            </p>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm font-semibold text-pompaca-purple dark:text-purple-300">
                                Genetics:
                            </p>
                            <ScrollArea className="h-24 mt-1 relative rounded-md border border-pompaca-purple/30 p-2 bg-dusk-purple/70  dark:bg-midnight-purple/50 overflow-x-scroll wrap-normal">
                                <div className="text-xs font-mono text-pompaca-purple dark:text-purple-400 ">
                                    {creature.geneData?.map((gene) => (
                                        <div key={gene.category}>
                                            <span className="font-bold text-pompaca-purple dark:text-purple-300">
                                                {gene.category}:
                                            </span>
                                            <div className="pl-2 ">
                                                <div>Phenotype: {gene.phenotype}</div>
                                                <div>Genotype: {gene.genotype}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <ScrollBar orientation="vertical" />
                                <div className="absolute top-0 right-0 h-full w-4 flex flex-col items-stretch justify-between py-1 pointer-events-none bg-dusk-purple">
                                    <ChevronUp className=" h-4 w-4 text-barely-lilac" />
                                    <ChevronDown className="h-4 w-4 text-barely-lilac" />
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}
