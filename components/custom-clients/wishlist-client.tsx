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
// Import the Select component
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { speciesList, structuredGeneData, AllSpeciesGeneData } from '@/constants/creature-data';

type WishlistItem = {
    goal: EnrichedResearchGoal;
    owner: { username: string | null; id: string; allowWishlistGoalSaving: boolean };
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
    const [species, setSpecies] = useState(searchParams.get('species') || 'all');
    const [generation, setGeneration] = useState(searchParams.get('generation') || '');
    const [geneCategory, setGeneCategory] = useState(searchParams.get('geneCategory') || '');
    const [geneQuery, setGeneQuery] = useState(searchParams.get('geneQuery') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'updatedAt'); // Add sortBy state
    const [debouncedQuery] = useDebounce(query, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const setOrDelete = (key: string, value: string | boolean) => {
            if (value && value !== 'all' && value !== 'any') {
                params.set(key, String(value));
            } else {
                params.delete(key);
            }
        };

        setOrDelete('query', debouncedQuery);
        setOrDelete('showMatches', showMatches);
        setOrDelete('isSeasonal', isSeasonal);
        setOrDelete('species', species);
        setOrDelete('generation', generation);
        setOrDelete('geneCategory', geneCategory);
        setOrDelete('geneQuery', geneQuery);
        params.set('sortBy', sortBy); // Add sortBy to URL params
        router.replace(`${pathname}?${params.toString()}`);
    }, [
        debouncedQuery,
        showMatches,
        isSeasonal,
        species,
        generation,
        geneCategory,
        geneQuery,
        sortBy,
        pathname,
        router,
        searchParams,
    ]);

    const apiParams = useMemo(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set('query', debouncedQuery);
        if (isSeasonal) params.set('isSeasonal', 'true');
        if (species && species !== 'all') params.set('species', species);
        if (generation) params.set('generation', generation);
        if (geneCategory && geneCategory !== 'any') params.set('geneCategory', geneCategory);
        if (geneQuery && geneQuery !== 'any') params.set('geneQuery', geneQuery);
        params.set('sortBy', sortBy); // Add sortBy to API params
        return params;
    }, [debouncedQuery, isSeasonal, species, generation, geneCategory, geneQuery, sortBy]);

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

    const availableGeneCategories = useMemo(() => {
        if (!species || species === 'all') return [];
        return Object.keys((structuredGeneData as AllSpeciesGeneData)[species] || {}).filter(
            (cat) => cat !== 'Gender' && cat !== 'isSeasonal' && cat !== 'hasNoGenetics'
        );
    }, [species]);

    const availableGeneOptions = useMemo(() => {
        if (!species || species === 'all' || !geneCategory || geneCategory === 'any') return [];
        const categoryData = (structuredGeneData as AllSpeciesGeneData)[species]?.[geneCategory];
        if (typeof categoryData !== 'object' || !Array.isArray(categoryData)) {
            return [];
        }
        const phenotypes = new Set(categoryData.map((g) => g.phenotype));
        return Array.from(phenotypes).map((p) => ({ value: p, label: p }));
    }, [species, geneCategory]);

    const handleSpeciesChange = (value: string) => {
        setSpecies(value);
        setGeneCategory('');
        setGeneQuery('');
    };

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
            <div className="flex flex-wrap gap-4 mb-6">
                <Select value={species} onValueChange={handleSpeciesChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Species" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        {speciesList.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={generation} onValueChange={setGeneration}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Generation" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Any Generation</SelectItem>
                        {[...Array(10).keys()].map((i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                                G{i + 1}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {species !== 'all' && (
                    <>
                        <Select value={geneCategory} onValueChange={setGeneCategory}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Trait Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any Trait</SelectItem>
                                {availableGeneCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {geneCategory && geneCategory !== 'any' && (
                            <Select value={geneQuery} onValueChange={setGeneQuery}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Trait" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    {availableGeneOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </>
                )}
            </div>
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Add the Sort By dropdown */}
                <div className="flex items-center space-x-2">
                    <Label htmlFor="sort-by">Sort by</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger id="sort-by" className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="updatedAt">Newest</SelectItem>
                            <SelectItem value="species">Species</SelectItem>
                        </SelectContent>
                    </Select>
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
