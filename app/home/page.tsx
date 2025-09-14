'use client';

import Link from 'next/link';
import Image from 'next/image';

// Placeholder for news items. You can fetch this from a CMS or a local file.
const newsItems = [
    {
        title: 'Welcome to the TFO.creaturetracker Launch! (This post is in the future 👀)',
        date: 'September 18th, 2025', // Example date
        content: (
            <>
                <p>
                    We're thrilled to have you here for the official launch of TFO.creaturetracker,
                    which we have come to affectionately call "tfoct". This is your dashboard to
                    manage everything related to breeding creatures in The Final Outpost. Start by
                    adding your creatures to your{' '}
                    <Link
                        href="/collection"
                        className="text-pompaca-purple dark:text-purple-400 hover:underline font-semibold"
                    >
                        Collection
                    </Link>
                    .
                </p>
                <p>
                    For the latest news, behind-the-scenes content, and to support development and
                    the TFO community, please consider becoming a subscriber on our{' '}
                    <a
                        href="https://patreon.com/tfoct"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pompaca-purple dark:text-purple-400 hover:underline font-semibold"
                    >
                        Patreon
                    </a>
                    . Join our{' '}
                    <a
                        href="https://discord.gg/PMtE3jrXYR"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pompaca-purple dark:text-purple-400 hover:underline font-semibold"
                    >
                        Discord
                    </a>{' '}
                    to chat with the team and give feedback!
                </p>
            </>
        ),
    },
    {
        title: 'Hey Beta Testers, the home page is live!',
        date: 'September 13th, 2025', // Example date
        content: (
            <p>
                Let me know what you think in the Discord, and feel free to report any issues, ideas
                for new features, or bugs you might find as Github issues as usual.
            </p>
        ),
    },
];

export default function Page() {
    return (
        <div className="min-h-screen bg-barely-lilac dark:bg-midnight-purple text-midnight-purple dark:text-barely-lilac p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-3xl">
                        Welcome to TFO.CT labs, let's do some science!
                    </h1>
                    <p className="text-pompaca-purple dark:text-purple-300 mt-2 text-lg">
                        This is your dashboard for managing creatures, breeding pairs, and research
                        goals in The Final Outpost.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Actions Column */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Get Started</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ActionButton
                                href="/collection"
                                imgSrc="/images/navigation/collection_button_home.png"
                                title="My Collection"
                                description="View and manage all your creatures."
                            />
                            <ActionButton
                                href="/breeding-pairs"
                                imgSrc="/images/navigation/breeding_pairs_button_home.png"
                                title="Breeding Pairs"
                                description="Create and track your breeding projects."
                            />
                            <ActionButton
                                href="/research-goals"
                                imgSrc="/images/navigation/research_goals_button_home.png"
                                title="Research Goals"
                                description="Define and pursue specific genetic goals."
                            />
                        </div>
                    </div>

                    {/* News Column */}
                    <aside className="lg:col-span-1">
                        <div className="bg-ebena-lavender/50 dark:bg-black/20 p-6 rounded-lg h-full">
                            <h2 className="text-2xl font-bold mb-4 border-b border-pompaca-purple/20 dark:border-barely-lilac/20 pb-2">
                                News & Updates
                            </h2>
                            <div className="space-y-6">
                                {newsItems.map((item, index) => (
                                    <div key={index}>
                                        <h3 className="font-semibold text-lg">{item.title}</h3>
                                        <time className="text-sm text-pompaca-purple dark:text-purple-300/80">
                                            {item.date}
                                        </time>
                                        <div className="text-pompaca-purple dark:text-purple-300 mt-1">
                                            {item.content}
                                        </div>
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

// A reusable component for the main action buttons
function ActionButton({
    href,
    imgSrc,
    title,
    description,
}: {
    href: string;
    imgSrc: string;
    title: string;
    description: string;
}) {
    return (
        <Link href={href} className="group block">
            <div className="bg-ebena-lavender/50 dark:bg-black/20 rounded-lg p-4 text-center transition-transform duration-200 ease-in-out group-hover:scale-105 group-hover:bg-ebena-lavender/70 dark:group-hover:bg-black/30 h-full flex flex-col justify-between">
                <div className="relative w-60 h-60 mx-auto mb-4">
                    <Image
                        src={imgSrc}
                        alt={`${title} icon`}
                        fill
                        style={{ objectFit: 'contain' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <div>
                    <h3 className="font-bold text-xl">{title}</h3>
                    <p className="text-sm text-pompaca-purple dark:text-purple-300">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
