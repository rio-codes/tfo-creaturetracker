'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { WishlistCard } from '../custom-cards/wishlist-card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { EnrichedResearchGoal, EnrichedCreature } from '@/types';
import { useDebounce } from 'use-debounce';

type WishlistItem = {
    goal: EnrichedResearchGoal;
    owner: { username: string | null; id: string };
};

// TODO: use existing gene matching logic, add image matching for creatures without genes
function creatureMatchesGoal(creature: EnrichedCreature, goal: EnrichedResearchGoal): boolean {
    if (creature?.species !== goal.species) return false;
    if ((goal as any).hasNoGenetics) return false;

    for (const [category, targetGene] of Object.entries(goal.genes)) {
        if (!(targetGene as any).isOptional) {
            const creatureGene = creature.geneData.find((g) => g.category === category);
            if (!creatureGene) return false;

            if (goal.goalMode === 'genotype') {
                if (creatureGene.genotype !== (targetGene as any).genotype) return false;
            } else {
                if (creatureGene.phenotype !== (targetGene as any).phenotype) return false;
            }
        }
    }
    return true;
}

async function fetchWishlist(params: URLSearchParams): Promise<WishlistItem[]> {
    const response = await fetch(`/api/wishlist?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch wishlist');
    return response.json();
}

export function WishlistClient({ userCreatures }: { userCreatures: EnrichedCreature[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('query') || '');
    const [showMatches, setShowMatches] = useState(searchParams.get('showMatches') === 'true');
    const [isSeasonal, setIsSeasonal] = useState(searchParams.get('isSeasonal') === 'true');
    const [debouncedQuery] = useDebounce(query, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedQuery) params.set('query', debouncedQuery);
        else params.delete('query');
        if (showMatches) params.set('showMatches', 'true');
        else params.delete('showMatches');
        if (isSeasonal) params.set('isSeasonal', 'true');
        else params.delete('isSeasonal');
        router.replace(`?${params.toString()}`);
    }, [debouncedQuery, showMatches, isSeasonal, pathname, router, searchParams]);

    const apiParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set('query', debouncedQuery);
        if (isSeasonal) params.set('isSeasonal', 'true');
        return params;
    }, [debouncedQuery, isSeasonal]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['wishlist', apiParams.toString()],
        queryFn: () => fetchWishlist(apiParams),
    });

    const creatureMatchMap = useMemo(() => {
        const map = new Map<string, string>();
        if (!data) return map;
        for (const wish of data) {
            for (const creature of userCreatures) {
                if (creatureMatchesGoal(creature, wish.goal)) {
                    map.set(wish.goal.id, creature!.id);
                    break;
                }
            }
        }
        return map;
    }, [data, userCreatures]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (showMatches) {
            return data.filter((wish) => creatureMatchMap.has(wish.goal.id));
        }
        return data;
    }, [data, showMatches, creatureMatchMap]);

    return (
        <div>
            <div className="flex flex-wrap gap-4 mb-6">
                <Input
                    placeholder="Search by goal, species, user, or gene..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="show-matches"
                        checked={showMatches}
                        onCheckedChange={(checked) => setShowMatches(!!checked)}
                    />
                    <Label htmlFor="show-matches">Only show goals I can fulfill</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is-seasonal"
                        checked={isSeasonal}
                        onCheckedChange={(checked) => setIsSeasonal(!!checked)}
                    />
                    <Label htmlFor="is-seasonal">Only show seasonal species</Label>
                </div>
            </div>

            {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                    ))}
                </div>
            )}

            {error && (
                <p className="text-red-500">Failed to load wishlist. Please try again later.</p>
            )}

            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredData.length > 0 ? (
                        filteredData.map((wish) => (
                            <WishlistCard
                                key={wish.goal.id}
                                wish={wish}
                                matchingCreatureId={creatureMatchMap.get(wish.goal.id)}
                            />
                        ))
                    ) : (
                        <p>No public goals match your criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
}
