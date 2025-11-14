import Link from 'next/link';
import { FlairIcon } from '@/components/misc-custom-components/flair-icon';

export const newsItems = [
    {
        title: 'The Community Wishlist is Live!',
        date: 'October 23rd, 2025', // Example date
        content: (
            <>
                <details>
                    <summary>
                        The much-requested Community Wishlist feature is live! Add your seasonal (or
                        any) research goals to the Community Wishlist using the ✨ sparkle button on
                        your goal, then head over to{' '}
                        <Link
                            className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                            href="/community-wishlist"
                        >
                            Community Wishlist
                        </Link>{' '}
                        to see if anyone's goals match your creatures! You will see an indicator
                        if there's a match, and with our new messaging system, you can set up a
                        trade! Happy Hallowsnight!
                    </summary>
                </details>
            </>
        ),
    },
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
                        You'll get used to the feeling. But we have to do the only thing we can
                        do...science!
                    </p>
                    <p>
                        Keep creating those goals, and by all means keep bringing in creatures from
                        the labs we came from! I hear some new creatures have surfaced in the archi-
                        I MEAN connection to the Final Outpost! How lovely! Have you seen them yet?
                        There will be treats for you and yours on Hallowsnight if you bring in as
                        many new research subjects as you can, and as long as you STAY ON THE PATHS
                        you will be safe and sound. Merry Hallowsnight and good luck navigating the
                        currents! Oh, and if you aren't pleased with my festive color palette
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
                        Another week, more new TFOCT features! Since last time, we've added some
                        fun stuff:
                    </summary>
                    <ul>
                        <li>
                            <strong>User Activity Log</strong>
                            <br />
                            Yup, just like our big sister site TFO and many others, we now have an{' '}
                            <Link
                                className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                href="/account/activity"
                            >
                                Activity Log
                            </Link>{' '}
                            that watches your every move on the site, so you can remember the name
                            of that Research Goal you made yesterday that was so cool, or find out
                            if you've synced that tab yet today. <br />
                            <br />
                            You are the only one that can see it, but I guess if you want to take a
                            screenshot and show off all the cool stuff you've been up to, knock
                            yourself out!
                        </li>
                        <br />
                        <li>
                            <strong>Editable Generation Indicators on Creature Names</strong>
                            <br />
                            You may notice that every time you see a reference to a creature now, it
                            has a generation indicator such as &#34;G1&#34; next to its name. You
                            can also set the origin of G1 creatures to Cupboard or Genome Splicer,
                            and of any creature to &#34;Another Lab&#34; as well as change the
                            generation manually. We do our best to guess the generation based on
                            your breeding logs, but we can't know what goes on in...Another Lab.{' '}
                            <br />
                            <br />
                            In any case, this feature is useful to create that perfect pedigree
                            without having to look it up on TFO, to look for those perfect unbred
                            G1s to hawk on the market, or just because the more data, the better! Am
                            I right? Speaking of which...
                        </li>
                        <br />
                        <li>
                            <strong>Fun Stats on the Homepage!</strong>
                            <br />
                            No explanation necessary really, just direct your gaze to the left, or
                            scroll back up on mobile, you passed it on the way here. Can't miss
                            it. The random creature is generated by selecting a possible outcome
                            from one of the site's breeding pairs...if you love the creature you
                            see and want to make it a goal let me know and I'll try and dig up
                            the genes!
                        </li>
                        <br />
                        <li>
                            <strong>Bugfixes</strong>
                            <br />
                            We've fixed some bugs with validating settings data, some layout
                            overflows on mobile, a bug where you couldn't add a second progeny
                            to a breeding log entry, and done some maintenance and cleanup under the
                            hood. If you want to see what's going on under there, one of our
                            useful internal updates is this{' '}
                            <Link
                                className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                href="https://github.com/rio-codes/tfo-creaturetracker/blob/main/CHANGELOG.md"
                            >
                                changelog
                            </Link>{' '}
                            which gives you the rundown on every change we've made since launch.
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
                            registration, thank you so much! If you run into any bugs yourself, feel
                            free to{' '}
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
                            , or if you are feeling really ambitious submit a bug report issue on
                            our{' '}
                            <Link
                                className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                                href="https://github.com/rio-codes/tfo-creaturetracker/issues"
                            >
                                GitHub
                            </Link>
                            ! You can help us make this site even better!
                        </li>
                    </ul>
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
                        . I'll be making a post there later tonight with some of the exciting
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
                        We've made a few changes (and fixed some bugs) since launch. Some
                        highlights include:
                    </summary>
                    <ul>
                        <li>
                            <strong>Flair for Admins, Beta Testers, and Patreon Supporters</strong>
                            <br />
                            We have added new icons we call &#34;flair&#34; to your profile if you
                            are one of our beta testers or Patreon supporters. Beta testers have
                            this microscope: <FlairIcon tier="beta_tester" />. The three Patreon
                            tiers have these creatures: <FlairIcon tier="postdoc" /> (Postdoc){' '}
                            <FlairIcon tier="assoc_prof" /> (Associate Professor),{' '}
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
                            Previously if you sold, traded, or gifted your creatures, there was no
                            option to remove them from your tfoct collection except deletion. This
                            took them out of the pedigree/inbred pairing detector. Now you can
                            archive your creatures directly from the collection page, or for
                            convenience if you are syncing all your tabs we archive missing
                            creatures for you. You can view/hide archived creatures with a checkbox
                            on the collection page.
                        </li>
                        <br />
                        <li>
                            <strong>
                                Un-feature creatures and research goals directly from profile
                            </strong>
                            <br />
                            You can now remove featured creatures and goals from your profile, not
                            just through the main creature collection and goal pages. Thanks to{' '}
                            <FlairIcon tier="beta_tester" />{' '}
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
                            Some of the bugs we fixed include issues with saving your item count in
                            settings, updating your profile, an issue where you were forced to name
                            a tab before syncing, and a fix to our goal prediction logic. Previously
                            if gender was marked as &#34;optional&#34; on a goal your match score
                            would go down, when it should go up! There's 100% chance of getting
                            a preferred gender, so it's basically a &#34;freebie&#34; in your
                            calculation. Thanks again to <FlairIcon tier="beta_tester" />
                            <Link
                                href="/Notherox"
                                className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-abyss hover:underline font-semibold"
                            >
                                Notherox
                            </Link>
                            !
                        </li>
                    </ul>
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
                    We're thrilled to have you here for the official launch of
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