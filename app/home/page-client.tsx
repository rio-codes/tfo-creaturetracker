'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Heart, Target, Dna, Rabbit, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';

type HomepageStats = {
    totalCreatures: number;
    totalPairs: number;
    totalGoals: number;
    popularSpecies: {
        species: string;
        count: number;
    } | null;
    prolificPair: {
        name: string;
        timesBred: number;
    } | null;
    randomCreature: {
        species: string;
        pairName: string;
        ownerUsername: string;
        image: string;
    } | null;
};

function ActionButton({
    href,
    imgSrcPrefix,
    title,
    description,
}: {
    href: string;
    imgSrcPrefix: string;
    title: string;
    description: string;
}) {
    const { data: session } = useSession();
    let theme = session?.user.theme;
    if (!theme) {
        theme = 'light';
    }
    switch (theme) {
        case 'dark':
            return (
                <div className="h-100">
                    <Link href={href} className="group block">
                        <div className="dark:bg-black/20 rounded-lg p-4 text-center transition-transform duration-200 ease-in-out group-hover:scale-105 dark:group-hover:bg-black/30 flex flex-col justify-center max-h-full min-w-0 max-w-80">
                            <div className="relative w-60 h-60 mx-auto mb-4">
                                <Image
                                    src={`${imgSrcPrefix}_dark.svg`}
                                    alt={`${title} icon`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="w-10vw h-10vw"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{title}</h3>
                                <p className="text-sm dark:text-purple-300">{description}</p>
                            </div>
                        </div>
                    </Link>
                </div>
            );
        case 'light':
            return (
                <div className="h-100">
                    <Link href={href} className="group block">
                        <div className="bg-ebena-lavender/50 rounded-lg p-4 text-center transition-transform duration-200 ease-in-out group-hover:scale-105 group-hover:bg-ebena-lavender/70 flex flex-col justify-center min-w-0 max-w-80 max-h-full">
                            <div className="relative w-60 h-60 mx-auto mb-4">
                                <Image
                                    src={`${imgSrcPrefix}.svg`}
                                    alt={`${title} icon`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="w-10vw h-10vw"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{title}</h3>
                                <p className="text-sm text-pompaca-purple">{description}</p>
                            </div>
                        </div>
                    </Link>
                </div>
            );
        case 'hallowsnight':
            return (
                <div className="h-100">
                    <Link href={href} className="group block">
                        <div className="hallowsnight:bg-ruzafolio-scarlet hallowsnight:group-hover:bg-blood-bay-wine/80 hallowsnight:text-cimo-crimson/80 rounded-lg p-4 text-center transition-transform duration-200 ease-in-out group-hover:scale-105 flex flex-col justify-center min-w-0 max-w-80">
                            <div className="relative w-60 h-60 mx-auto mb-4 max-h-full">
                                <Image
                                    src={`${imgSrcPrefix}_hn.svg`}
                                    alt={`${title} icon`}
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    sizes="w-10vw h-10vw"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{title}</h3>
                                <p className="text-sm hallowsnight:text-cimo-crimson/80">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            );
    }
}
export function HomePageClient({ stats }: { stats: HomepageStats }) {
    const [newsItems, setNewsItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchNews = async () => {
            const response = await fetch('/api/blog');
            const data = await response.json();
            setNewsItems(data);
        };
        fetchNews();
    }, []);

    return (
        <div className="min-h-screen bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-midnight-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-3xl">
                        Wow, that was strange. Did anyone else...Oh, hello! Welcome to TFO.ct.
                    </h1>
                    <p className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson/80 mt-2 text-lg">
                        Welcome back to your dashboard for managing creatures, breeding pairs, and
                        research goals in The Final Outpost.
                    </p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-7 gap-8 max-w-full">
                    {/* Main Actions Column */}
                    <div className="md:col-span-5">
                        <h2 className="text-2xl font-bold mb-4">Get Started</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 mg:grid-cols-5 gap-6 w-full md:w-auto mb-8 md:mb-0">
                            <ActionButton
                                href="/collection"
                                imgSrcPrefix="/images/navigation/my_collection"
                                title="My Collection"
                                description="View and manage all your creatures from The Final Outpost."
                            />
                            <ActionButton
                                href="/breeding-pairs"
                                imgSrcPrefix="/images/navigation/breeding_pairs"
                                title="Breeding Pairs"
                                description="Create and track your breeding projects."
                            />
                            <ActionButton
                                href="/research-goals"
                                imgSrcPrefix="/images/navigation/research_goals"
                                title="Research Goals"
                                description="Define and pursue specific genetic goals."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:w-2/3 mb-8 md:mb-0 just-fy-center z-10">
                            <ActionButton
                                href="/community-wishlist"
                                imgSrcPrefix="/images/navigation/community_wishlist"
                                title="Community Wishlist"
                                description="View other researchers' goals and share your own goals."
                            />
                            <ActionButton
                                href="/checklists"
                                imgSrcPrefix="/images/navigation/checklists"
                                title="Custom Checklists"
                                description="Create custom checklists for your selected genes."
                            />
                        </div>

                        <div className="mt-8 max-w-full md:w-auto">
                            <h2 className="text-2xl font-bold mb-4">Stats</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 border-0">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            Total Creatures
                                        </CardTitle>
                                        <PawPrint className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            {stats.totalCreatures}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 border-0">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            Total Breeding Pairs
                                        </CardTitle>
                                        <Heart className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            {stats.totalPairs}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 border-0">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            Total Research Goals
                                        </CardTitle>
                                        <Target className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            {stats.totalGoals}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 border-0">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            Most Popular Species
                                        </CardTitle>
                                        <Dna className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss" />
                                    </CardHeader>
                                    <CardContent>
                                        {stats.popularSpecies ? (
                                            <div className="flex flex-col h-full md:gap-y-53">
                                                <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                                    {stats.popularSpecies.species}

                                                    <p className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                                                        with {stats.popularSpecies.count} total
                                                        creatures
                                                    </p>
                                                </div>
                                                <div className="text-md relative y-5 font-normal align-text-bottom text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss mt-2">
                                                    It's horses, isn't it. I bet anything it's
                                                    horses.
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss pt-2">
                                                No data.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 border-0">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            Most Prolific Pair
                                        </CardTitle>
                                        <Rabbit className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss" />
                                    </CardHeader>
                                    <CardContent>
                                        {stats.prolificPair ? (
                                            <div className="flex flex-col h-full md:gap-y-45">
                                                <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson wrap-anywhere">
                                                    {stats.prolificPair.name || 'Unnamed Pair'}
                                                    <p className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                                                        Bred {stats.prolificPair.timesBred} times
                                                    </p>
                                                </div>
                                                <div className="text-md relative y-5 font-normal align-text-bottom text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss mt-2">
                                                    That's...a lot of capsules. I'm suddenly so...
                                                    thirsty...
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss pt-2">
                                                No data.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 border-0">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                            Look!
                                        </CardTitle>
                                        <Sparkles className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss" />
                                    </CardHeader>
                                    <CardContent className="text-center">
                                        {stats.randomCreature?.image ? (
                                            <div className="pt-2">
                                                <img
                                                    src={stats.randomCreature.image}
                                                    alt={
                                                        stats.randomCreature.species || 'A creature'
                                                    }
                                                    className="rounded-md object-scale-down aspect-square w-full"
                                                />
                                                <p className="text-xs mt-2 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss text-pretty">
                                                    A potential{' '}
                                                    <span className="font-bold">
                                                        {stats.randomCreature.species}
                                                    </span>{' '}
                                                    from the pair{' '}
                                                    <span className="font-bold">
                                                        {stats.randomCreature.pairName}
                                                    </span>{' '}
                                                    by{' '}
                                                    <Link
                                                        href={`/${stats.randomCreature.ownerUsername}`}
                                                        className="font-bold hover:underline"
                                                    >
                                                        {stats.randomCreature.ownerUsername}
                                                    </Link>
                                                    !
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss pt-2">
                                                Could not generate a creature.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                    {/* News Column */}
                    <aside className="md:col-span-2">
                        <div className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 p-6 rounded-lg h-full">
                            <h2 className="text-2xl font-bold mb-4 border-b border-pompaca-purple/20 dark:border-barely-lilac/20 pb-2">
                                News & Updates
                            </h2>

                            <div className="space-y-6">
                                {newsItems.map((item, index) => (
                                    <div key={index}>
                                        <h3 className="font-semibold text-lg">{item.title}</h3>
                                        <time className="text-sm text-pompaca-purple dark:text-purple-300 hallowsnight:text-blood-bay-wine">
                                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </time>
                                        <div
                                            className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-abyss mt-1"
                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
}
