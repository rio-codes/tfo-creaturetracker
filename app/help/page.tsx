import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export default function HelpPage() {
    return (
        <div className="bg-barely-lilac text-pompaca-purple dark:bg-deep-purple dark:text-barely-lilac min-h-screen flex items-center justify-center px-4 py-5">
            <div className="w-full max-w-6xl">
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple w-full shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Help & FAQ</CardTitle>
                        <CardDescription className="text-xl">
                            How to use TFO.creaturetracker
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-col py-5 text-md">
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>
                                    Getting Started: Adding Creatures
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        To begin, you need to add your creatures
                                        from The Final Outpost (TFO) to your
                                        collection.
                                    </p>
                                    <ol className="list-decimal list-inside space-y-2 mt-2">
                                        <li>
                                            Navigate to the{' '}
                                            <strong>Collection</strong> page.
                                        </li>
                                        <li>
                                            Click the{' '}
                                            <strong>
                                                + Add or Update Creatures
                                            </strong>{' '}
                                            button.
                                        </li>
                                        <li>
                                            In the dialog, you'll need to
                                            provide your TFO Tab ID. You can
                                            find this in the URL of your
                                            creature tabs on TFO. For example,
                                            if the URL is{' '}
                                            <code>
                                                https://finaloutpost.net/tab/your_username/tab_name/12345/1/
                                            </code>
                                            , your Tab ID is <code>12345</code>.
                                            Your default tab (the one without a
                                            number in the URL) has an ID of{' '}
                                            <code>0</code>.
                                        </li>
                                        <li>
                                            <strong>Important:</strong> Your
                                            creature tab on TFO must be set to
                                            "Public" for the sync to work.
                                        </li>
                                        <li>
                                            You can save multiple tabs and
                                            choose which ones to sync each time.
                                            Click "Sync All Checked" to import
                                            your creatures.
                                        </li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>
                                    Research Goals
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        Research Goals are how you define what
                                        you want to breed. You can create a goal
                                        for a specific look (phenotype) or a
                                        specific genetic code (genotype).
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 mt-2">
                                        <li>
                                            <strong>Creating a Goal:</strong> On
                                            the Research Goals page, click "+
                                            New Goal". You can specify a
                                            species, name, and the desired
                                            genes. You can also create a goal
                                            directly from a breeding pair's
                                            "Possible Outcomes" dialog.
                                        </li>
                                        <li>
                                            <strong>
                                                Phenotype vs. Genotype Mode:
                                            </strong>
                                            <ul className="list-disc list-inside ml-4">
                                                <li>
                                                    <strong>
                                                        Phenotype Mode:
                                                    </strong>{' '}
                                                    This is the default and
                                                    recommended mode. It
                                                    calculates odds based on
                                                    achieving a desired look
                                                    (e.g., "Steppes"), accepting
                                                    any genotype that produces
                                                    it.
                                                </li>
                                                <li>
                                                    <strong>
                                                        Genotype Mode:
                                                    </strong>{' '}
                                                    For advanced users. It
                                                    calculates odds for
                                                    achieving an exact genetic
                                                    code. Match scores will be
                                                    much lower.
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <strong>Goal Tracker:</strong>{' '}
                                            Clicking on a goal card takes you to
                                            its tracker page. Here, you can
                                            assign breeding pairs to the goal
                                            and see their "Match Score" - the
                                            probability of achieving the goal
                                            with that pair.
                                        </li>
                                        <li>
                                            <strong>Sharing a Goal:</strong> On
                                            the Goal Tracker page, you'll find a
                                            share button. This generates a
                                            public link that you can give to
                                            others. They can view your goal's
                                            details, assigned pairs, and match
                                            scores without needing to log in.
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>
                                    Breeding Pairs
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        Breeding Pairs are the core of the
                                        tracker. You can create pairs, view
                                        their potential offspring, and log your
                                        breeding events.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 mt-2">
                                        <li>
                                            <strong>Creating a Pair:</strong>{' '}
                                            You can create a pair from the
                                            Breeding Pairs page by clicking "+
                                            New Pair", or from a creature's card
                                            by clicking "Manage Breeding Pairs".
                                        </li>
                                        <li>
                                            <strong>Possible Outcomes:</strong>{' '}
                                            On a breeding pair's card, click
                                            "Possible Outcomes" to see a
                                            detailed breakdown of all potential
                                            genes and their probabilities for
                                            the offspring. You can also generate
                                            a preview image of any combination
                                            and save it as a new Research Goal.
                                        </li>
                                        <li>
                                            <strong>Logging Breedings:</strong>{' '}
                                            Click "Log Breeding" to create a new
                                            log entry. You can add notes and
                                            link any resulting progeny from your
                                            collection. This updates the "Times
                                            Bred" count and adds the progeny to
                                            the pair's list.
                                        </li>
                                        <li>
                                            <strong>Viewing Logs:</strong> Click
                                            the "Logs" button on a pair's card
                                            to see a history of all breeding
                                            events, including notes and linked
                                            progeny.
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
