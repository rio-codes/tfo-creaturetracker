import Link from 'next/link';
import Image from 'next/image';
import { FlairIcon } from '@/components/misc-custom-components/flair-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint, Heart, Target, Dna, Rabbit, Sparkles } from 'lucide-react';
import {
    users,
    creatures,
    breedingPairs,
    researchGoals,
    breedingLogEntries,
} from '@/src/db/schema';
import { db } from '@/src/db';
import { count, desc, sql, isNotNull, eq, and } from 'drizzle-orm';
import { enrichAndSerializeCreature } from '@/lib/serialization';
import { calculateAllPossibleOutcomes } from '@/lib/genetics';
import { constructTfoImageUrl } from '@/lib/tfo-utils';
import { fetchAndUploadWithRetry } from '@/lib/data';

export const dynamic = 'force-dynamic';

type HomepageStats = {
    totalCreatures: number;
    totalPairs: number;
    totalGoals: number;
    popularSpecies: {
        species: string | null;
        count: number;
    } | null;
    prolificPair: {
        id: string;
        name: string | null;
        timesBred: number;
        breeder: {
            username: string | null;
            id: string;
        } | null;
    } | null;
    randomCreature: {
        image: string | null;
        species: string | null;
        code: string;
    } | null;
};

type ProlificPair = {
    id: string;
    name: string | null;
    timesBred: number;
    breeder: {
        username: string | null;
        id: string;
    } | null;
} | null;
type RandomCreature = {
    image: string | null;
    species: string | null;
    code: string;
    genes: { [category: string]: { genotype: string; phenotype: string } };
} | null;

async function getHomepageStats(): Promise<HomepageStats> {
    const [totalCreaturesResult, totalPairsResult, totalGoalsResult] = await Promise.all([
        db.select({ value: count() }).from(creatures),
        db.select({ value: count() }).from(breedingPairs),
        db.select({ value: count() }).from(researchGoals),
    ]);

    const popularSpeciesQuery = await db
        .select({
            species: creatures.species,
            count: sql<number>`count(${creatures.id})`.mapWith(Number).as('species_count'),
        })
        .from(creatures)
        .where(isNotNull(creatures.species))
        .groupBy(creatures.species)
        .orderBy(desc(sql`species_count`))
        .limit(1);

    const prolificPairLogQuery = await db
        .select({
            pairId: breedingLogEntries.pairId,
            timesBred: sql<number>`count(${breedingLogEntries.id})`
                .mapWith(Number)
                .as('times_bred'),
        })
        .from(breedingLogEntries)
        .where(isNotNull(breedingLogEntries.pairId))
        .groupBy(breedingLogEntries.pairId)
        .orderBy(desc(sql`times_bred`))
        .limit(1);
    let prolificPair: ProlificPair = null;
    if (prolificPairLogQuery.length > 0) {
        const { pairId, timesBred } = prolificPairLogQuery[0];
        if (pairId) {
            const pairInfo = await db.query.breedingPairs.findFirst({
                where: eq(breedingPairs.id, pairId),
                columns: {
                    id: true,
                    pairName: true,
                    userId: true,
                },
            });
            if (pairInfo && pairInfo.userId) {
                const breederInfo = await db.query.users.findFirst({
                    where: eq(users.id, pairInfo.userId),
                    columns: { id: true, username: true },
                });
                prolificPair = {
                    id: pairInfo.id,
                    name: pairInfo.pairName,
                    timesBred: timesBred,
                    breeder: breederInfo
                        ? { id: breederInfo.id, username: breederInfo.username }
                        : null,
                };
            }
        }
    }

    let randomCreature: RandomCreature = null;
    const randomPair = await db.query.breedingPairs.findFirst({
        orderBy: sql`RANDOM()`,
        where: and(isNotNull(breedingPairs.maleParentId), isNotNull(breedingPairs.femaleParentId)),
        with: { maleParent: true, femaleParent: true },
    });

    if (randomPair && randomPair.maleParent && randomPair.femaleParent) {
        const maleParentEnriched = enrichAndSerializeCreature(randomPair.maleParent);
        const femaleParentEnriched = enrichAndSerializeCreature(randomPair.femaleParent);
        const outcomesByCategory = calculateAllPossibleOutcomes(
            maleParentEnriched,
            femaleParentEnriched
        );
        const selectedGenes: { [category: string]: { genotype: string; phenotype: string } } = {};
        for (const category in outcomesByCategory) {
            const outcomes = outcomesByCategory[category];
            let rand = Math.random();
            let chosenOutcome = outcomes[outcomes.length - 1];
            for (const outcome of outcomes) {
                if (rand < outcome.probability) {
                    chosenOutcome = outcome;
                    break;
                }
                rand -= outcome.probability;
            }
            selectedGenes[category] = {
                genotype: chosenOutcome.genotype,
                phenotype: chosenOutcome.phenotype,
            };
        }
        const selectedGenotypes = Object.fromEntries(
            Object.entries(selectedGenes).map(([cat, gene]) => [cat, gene.genotype])
        );
        let imageUrl: string | null = null;
        try {
            const tfoImageUrl = constructTfoImageUrl(randomPair.species, selectedGenotypes);
            const bustedTfoImageUrl = `${tfoImageUrl}&_cb=${new Date().getTime()}`;
            imageUrl = await fetchAndUploadWithRetry(
                bustedTfoImageUrl,
                `admin-preview-${randomPair.id}-${Date.now()}`,
                3
            );
        } catch (error) {
            console.error('Failed to generate preview image for admin metrics:', error);
        }
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        for (let i = 0; i < 5; i++) {
            randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        randomCreature = {
            image: imageUrl,
            species: randomPair.species,
            code: randomCode,
            genes: selectedGenes,
        };
    }

    return {
        totalCreatures: totalCreaturesResult[0].value,
        totalPairs: totalPairsResult[0].value,
        totalGoals: totalGoalsResult[0].value,
        popularSpecies: popularSpeciesQuery.length > 0 ? popularSpeciesQuery[0] : null,
        prolificPair,
        randomCreature,
    };
}

// Placeholder for news items. You can fetch this from a CMS or a local file.
const newsItems = [
    {
        title: "It's Nearly Hallowsnight, Don't Stray from the Paths",
        date: 'October 18th, 2025', // Example date
        content: (
            <>
                <details>
                    <summary>This place is changing, stay close to the labs if you can...</summary>
                    <p>
                        You may find that your assigned computer system has gained
                        some...enhancements in the coming days. I know, I know, your creatures seem
                        a bit different than you recall, and we all wonder how we got here, truly.
                        You&#39;ll get used to the feeling. But we have to do the only thing we can
                        do...science!
                    </p>
                    <p>
                        Keep creating those goals, and by all means keep bringing in creatures from
                        the labs we came from! I hear some new creatures have surfaced in the archi-
                        I MEAN connection to the Final Outpost! How lovely! Have you seen them yet?
                        There will be treats for you and yours on Hallowsnight if you bring in as
                        many new research subjects as you can, and as long as you STAY ON THE PATHS
                        you will be safe and sound. Merry Hallowsnight and good luck navigating the
                        currents! Oh, and if you aren&#39;t pleased with my festive color palette
                        you can change it at the bottom of the page as usual.
                    </p>
                </details>
            </>
        ),
    },
    {
        title: 'So Much Good Stuff!',
        date: 'September 26th, 2025', // Example date
        content: (
            <>
                <details>
                    <summary>
                        Another week, more new TFOCT features! Since last time, we&#39;ve added some
                        fun stuff:
                    </summary>
                    <p>
                        <ul>
                            <li>
                                <strong>User Activity Log</strong>
                                <br />
                                Yup, just like our big sister site TFO and many others, we now have
                                an{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="/account/activity"
                                >
                                    Activity Log
                                </Link>{' '}
                                that watches your every move on the site, so you can remember the
                                name of that Research Goal you made yesterday that was so cool, or
                                find out if you&#39;ve synced that tab yet today. <br />
                                <br />
                                You are the only one that can see it, but I guess if you want to
                                take a screenshot and show off all the cool stuff you&#39;ve been up
                                to, knock yourself out!
                            </li>
                            <br />
                            <li>
                                <strong>Editable Generation Indicators on Creature Names</strong>
                                <br />
                                You may notice that every time you see a reference to a creature
                                now, it has a generation indicator such as &#34;G1&#34; next to its
                                name. You can also set the origin of G1 creatures to Cupboard or
                                Genome Splicer, and of any creature to &#34;Another Lab&#34; as well
                                as change the generation manually. We do our best to guess the
                                generation based on your breeding logs, but we can&#39;t know what
                                goes on in...Another Lab. <br />
                                <br />
                                In any case, this feature is useful to create that perfect pedigree
                                without having to look it up on TFO, to look for those perfect
                                unbred G1s to hawk on the market, or just because the more data, the
                                better! Am I right? Speaking of which...
                            </li>
                            <br />
                            <li>
                                <strong>Fun Stats on the Homepage!</strong>
                                <br />
                                No explanation necessary really, just direct your gaze to the left,
                                or scroll back up on mobile, you passed it on the way here.
                                Can&#39;t miss it. The random creature is generated by selecting a
                                possible outcome from one of the site&#39;s breeding pairs...if you
                                love the creature you see and want to make it a goal let me know and
                                I&#39;ll try and dig up the genes!
                            </li>
                            <br />
                            <li>
                                <strong>Bugfixes</strong>
                                <br />
                                We&#39;ve fixed some bugs with validating settings data, some layout
                                overflows on mobile, a bug where you couldn&#39;t add a second
                                progeny to a breeding log entry, and done some maintenance and
                                cleanup under the hood. If you want to see what&#39;s going on under
                                there, one of our useful internal updates is this{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="https://github.com/rio-codes/tfo-creaturetracker/blob/main/CHANGELOG.md"
                                >
                                    changelog
                                </Link>{' '}
                                which gives you the rundown on every change we&#39;ve made since
                                launch.
                                <br />
                                <br />
                                Also, one of our new users,{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss   hover:underline font-semibold"
                                    href="/Solarion"
                                >
                                    Solarion
                                </Link>
                                {', '}
                                alerted us to a major bug with dark mode text visibility during
                                registration, thank you so much! If you run into any bugs yourself,
                                feel free to{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="mailto:tfoct@mailbox.org"
                                >
                                    email
                                </Link>{' '}
                                us, hop into the{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="https://discord.gg/PMtE3jrXYR"
                                >
                                    Discord
                                </Link>
                                , or if you are feeling really ambitious submit a bug report issue
                                on our{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="https://github.com/rio-codes/tfo-creaturetracker/issues"
                                >
                                    GitHub
                                </Link>
                                ! You can help us make this site even better!
                            </li>
                        </ul>
                    </p>
                    <br />
                    <p>
                        As always, for previews of upcoming features, subscribe to our{' '}
                        <a
                            href="https://patreon.com/tfoct"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                        >
                            Patreon
                        </a>{' '}
                        . I&#39;ll be making a post there later tonight with some of the exciting
                        features on our roadmap.
                    </p>
                </details>
            </>
        ),
    },
    {
        title: 'New features, and some squashed bugs (oops)!',
        date: 'September 21st, 2025', // Example date
        content: (
            <>
                <details>
                    <summary>
                        We&#39;ve made a few changes (and fixed some bugs) since launch. Some
                        highlights include:
                    </summary>
                    <p>
                        <ul>
                            <li>
                                <strong>
                                    Flair for Admins, Beta Testers, and Patreon Supporters
                                </strong>
                                <br />
                                We have added new icons we call &#34;flair&#34; to your profile if
                                you are one of our beta testers or Patreon supporters. Beta testers
                                have this microscope: <FlairIcon tier="beta_tester" />. The three
                                Patreon tiers have these creatures: <FlairIcon tier="postdoc" />{' '}
                                (Postdoc) <FlairIcon tier="assoc_prof" /> (Associate Professor),{' '}
                                <FlairIcon tier="tenured_prof" /> (Tenured Professor). Finally, the
                                admins (
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="/lyricism"
                                >
                                    lyricism
                                </Link>{' '}
                                and{' '}
                                <Link
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                    href="/koda_curvata"
                                >
                                    koda_curvata
                                </Link>
                                ) have this atom symbol: <FlairIcon tier="admin" />.
                            </li>
                            <br />
                            <li>
                                <strong>Archiving for creatures you no longer own</strong>
                                <br />
                                Previously if you sold, traded, or gifted your creatures, there was
                                no option to remove them from your tfoct collection except deletion.
                                This took them out of the pedigree/inbred pairing detector. Now you
                                can archive your creatures directly from the collection page, or for
                                convenience if you are syncing all your tabs we archive missing
                                creatures for you. You can view/hide archived creatures with a
                                checkbox on the collection page.
                            </li>
                            <br />
                            <li>
                                <strong>
                                    Un-feature creatures and research goals directly from profile
                                </strong>
                                <br />
                                You can now remove featured creatures and goals from your profile,
                                not just through the main creature collection and goal pages. Thanks
                                to <FlairIcon tier="beta_tester" />{' '}
                                <Link
                                    href="/Notherox"
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                >
                                    Notherox
                                </Link>{' '}
                                for pointing out how useful this is!
                            </li>
                            <br />
                            <li>
                                <strong>Bugfixes</strong>
                                <br />
                                Some of the bugs we fixed include issues with saving your item count
                                in settings, updating your profile, an issue where you were forced
                                to name a tab before syncing, and a fix to our goal prediction
                                logic. Previously if gender was marked as &#34;optional&#34; on a
                                goal your match score would go down, when it should go up!
                                There&#39;s 100% chance of getting a preferred gender, so it&#39;s
                                basically a &#34;freebie&#34; in your calculation. Thanks again to{' '}
                                <FlairIcon tier="beta_tester" />
                                <Link
                                    href="/Notherox"
                                    className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                >
                                    Notherox
                                </Link>
                                !
                            </li>
                        </ul>
                    </p>
                    <br />
                    <p>
                        We have a lot of exciting features coming soon, check out our{' '}
                        <a
                            href="https://patreon.com/tfoct"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                        >
                            Patreon
                        </a>{' '}
                        for exclusive previews!
                    </p>
                </details>
            </>
        ),
    },
    {
        title: 'Welcome to the TFO.creaturetracker Launch!',
        date: 'September 19th, 2025', // Example date
        content: (
            <>
                <p>
                    We&#39;re thrilled to have you here for the official launch of
                    TFO.creaturetracker, which we have come to affectionately call &#34;tfoct&#34;.
                    This is your dashboard to manage everything related to breeding creatures in The
                    Final Outpost.{' '}
                    <Link
                        href="/register"
                        className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                    >
                        Register here
                    </Link>{' '}
                    to get started. Then add your creatures to your{' '}
                    <Link
                        href="/collection"
                        className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                    >
                        Collection
                    </Link>{' '}
                    and enjoy the site!
                </p>
                <p>
                    For the latest news, behind-the-scenes content, and to support development and
                    the TFO community, please consider becoming a subscriber on our{' '}
                    <a
                        href="https://patreon.com/tfoct"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                    >
                        Patreon
                    </a>
                    . Join our{' '}
                    <a
                        href="https://discord.gg/PMtE3jrXYR"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                    >
                        Discord
                    </a>{' '}
                    to chat with the team and give feedback!
                </p>
            </>
        ),
    },
];

export default async function Page() {
    const stats = await getHomepageStats();
    return (
        <div className="min-h-screen bg-barely-lilac dark:bg-midnight-purple hallowsnight:bg-abyss text-midnight-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl md:text-3xl">
                        Safe Hallowsnight to You, TFO.CT Researchers. Stay warm...
                    </h1>
                    <p className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson/80 mt-2 text-lg">
                        Welcome back to your dashboard for managing creatures, breeding pairs, and
                        research goals in The Final Outpost. I don&#39;t blame you for being a bit
                        spun about.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Actions Column */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Get Started</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="hallowsnight:opacity-100">
                                <ActionButton
                                    href="/collection"
                                    imgSrc="/images/navigation/collection_button_home.png"
                                    title="My Collection"
                                    description="View and manage all your creatures."
                                />
                            </div>
                            <div className="hallowsnight:opacity-100">
                                <ActionButton
                                    href="/breeding-pairs"
                                    imgSrc="/images/navigation/breeding_pairs_button_home.png"
                                    title="Breeding Pairs"
                                    description="Create and track your breeding projects."
                                />
                            </div>
                            <div className="hallowsnight:opacity-100">
                                <ActionButton
                                    href="/research-goals"
                                    imgSrc="/images/navigation/research_goals_button_home.png"
                                    title="Research Goals"
                                    description="Define and pursue specific genetic goals."
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-2xl font-bold mb-4">Stats</h2>
                            <div className="hallowsnight:opacity-100">
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
                                                        It&#39;s horses, isn&#39;t it. I bet
                                                        anything it&#39;s horses.
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
                                                    <div className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                                                        {stats.prolificPair.name || 'Unnamed Pair'}
                                                        <p className="text-xs text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                                                            Bred {stats.prolificPair.timesBred}{' '}
                                                            times
                                                        </p>
                                                    </div>
                                                    <div className="text-md relative y-5 font-normal align-text-bottom text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss mt-2">
                                                        That&#39;s...a lot of capsules. I&#39;m
                                                        suddenly so... thirsty...
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
                                                            stats.randomCreature.species ||
                                                            'A creature'
                                                        }
                                                        className="rounded-md object-scale-down aspect-square w-full"
                                                    />
                                                    <p className="text-xs mt-2 text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss text-pretty">
                                                        A wild{' '}
                                                        <span className="font-bold">
                                                            {stats.randomCreature.species}
                                                        </span>{' '}
                                                        with the code{' '}
                                                        <span>{stats.randomCreature.code}</span>{' '}
                                                        appeared!
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
                    </div>
                    {/* News Column */}
                    <aside className="lg:col-span-1">
                        <div className="hallowsnight:opacity-100">
                            <div className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 p-6 rounded-lg h-full">
                                <h2 className="text-2xl font-bold mb-4 border-b border-pompaca-purple/20 dark:border-barely-lilac/20 pb-2">
                                    News & Updates
                                </h2>

                                <div className="space-y-6">
                                    {newsItems.map((item, index) => (
                                        <div key={index}>
                                            <h3 className="font-semibold text-lg">{item.title}</h3>
                                            <time className="text-sm text-pompaca-purple dark:text-purple-300 hallowsnight:text-blood-bay-wine">
                                                {item.date}
                                            </time>
                                            <div className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-abyss mt-1">
                                                {item.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
            <div className="bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-black/20 rounded-lg p-4 text-center transition-transform duration-200 ease-in-out group-hover:scale-105 group-hover:bg-ebena-lavender/70 dark:group-hover:bg-black/30 hallowsnight:group-hover:bg-blood-bay-wine/80 h-full flex flex-col justify-between">
                <div className="relative w-60 h-60 mx-auto mb-4 hallowsnight:grayscale-100">
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
                    <p className="text-sm text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
