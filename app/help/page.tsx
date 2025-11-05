'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export default function HelpPage() {
    return (
        <div className="bg-barely-lilac text-pompaca-purple dark:bg-deep-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson min-h-screen flex items-center justify-center px-4 py-5">
            <div className="w-full max-w-6xl">
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet w-full shadow-lg">
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
                                        To begin, you need to add your creatures from The Final
                                        Outpost (TFO) to your collection.
                                    </p>
                                    <ol className="list-decimal list-inside space-y-2 mt-2">
                                        <li>
                                            Navigate to the <strong>Collection</strong> page.
                                        </li>
                                        <li>
                                            Click the <strong>+ Add or Update Creatures</strong>{' '}
                                            button.
                                        </li>
                                        <li>
                                            In the dialog, you&#39;ll need to provide your TFO Tab
                                            ID. You can find this in the URL of your creature tabs
                                            on TFO. For example, if the URL is{' '}
                                            <code>
                                                https://finaloutpost.net/tab/your_username/tab_name/12345/1/
                                            </code>
                                            , your Tab ID is <code>12345</code>. Your default tab
                                            (the one without a number in the URL) has an ID of{' '}
                                            <code>0</code>.
                                        </li>
                                        <li>
                                            <strong>Important:</strong> Your creature tab on TFO
                                            must be set to &#34;Public&#34; for the sync to work.
                                        </li>
                                        <li>
                                            You can save multiple tabs and choose which ones to sync
                                            each time. Click &#34;Sync All Checked&#34; to import
                                            your creatures.
                                        </li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Research Goals</AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        Research Goals are how you define what you want to breed.
                                        You can create a goal for a specific look (phenotype) or a
                                        specific genetic code (genotype).
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 mt-2">
                                        <li>
                                            <strong>Creating a Goal:</strong> On the Research Goals
                                            page, click &#34;+ New Goal&#34;. You can specify a
                                            species, name, and the desired genes. You can also
                                            create a goal directly from a breeding pair&#39;s
                                            &#34;Possible Outcomes&#34; dialog.
                                        </li>
                                        <li>
                                            <strong>Phenotype vs. Genotype Mode:</strong>
                                            <ul className="list-disc list-inside ml-4">
                                                <li>
                                                    <strong>Phenotype Mode:</strong> This is the
                                                    default and recommended mode. It calculates odds
                                                    based on achieving a desired look (e.g.,
                                                    &#34;Steppes&#34;), accepting any genotype that
                                                    produces it.
                                                </li>
                                                <li>
                                                    <strong>Genotype Mode:</strong> For advanced
                                                    users. It calculates odds for achieving an exact
                                                    genetic code. Match scores will be much lower.
                                                </li>
                                            </ul>
                                        </li>
                                        <li>
                                            <strong>Goal Tracker:</strong> Clicking on a goal card
                                            takes you to its tracker page. Here, you can assign
                                            breeding pairs to the goal and see their &#34;Match
                                            Score&#34; - an average of the probabilities of each
                                            trait in your goal.
                                            <br />
                                            <strong>Please note:</strong> this is not the actual
                                            probability of your pair having progeny that match your
                                            goal, That is usually much much less probable,
                                            especially for creatures with many genes. The Match
                                            Score is there to help you decide which pairs are better
                                            to breed for any given goal. If one pair has a higher
                                            score than another, you will probably want to prioritize
                                            that one when breeding.
                                        </li>
                                        <li>
                                            <strong>Sharing a Goal:</strong> On the Goal Tracker
                                            page, you&#39;ll find a share button. This generates a
                                            public link that you can give to others. They can view
                                            your goal&#39;s details, assigned pairs, and match
                                            scores without needing to log in.
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Breeding Pairs</AccordionTrigger>
                                <AccordionContent>
                                    <p>
                                        Breeding Pairs are the core of the tracker. You can create
                                        pairs, view their potential offspring, and log your breeding
                                        events.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 mt-2">
                                        <li>
                                            <strong>Creating a Pair:</strong> You can create a pair
                                            from the Breeding Pairs page by clicking &#34;+ New
                                            Pair&#34;, or from a creature&#39;s card by clicking
                                            &#34;Manage Breeding Pairs&#34;.
                                        </li>
                                        <li>
                                            <strong>Possible Outcomes:</strong> On a breeding
                                            pair&#39;s card, click &#34;Possible Outcomes&#34; to
                                            see a detailed breakdown of all potential genes and
                                            their probabilities for the offspring. You can also
                                            generate a preview image of any combination and save it
                                            as a new Research Goal.
                                        </li>
                                        <li>
                                            <strong>Logging Breedings:</strong> Click &#34;Log
                                            Breeding&#34; to create a new log entry. You can add
                                            notes and link any resulting progeny from your
                                            collection. This updates the &#34;Times Bred&#34; count
                                            and adds the progeny to the pair&#39;s list. Once
                                            you&#39;ve logged creatures as progeny, our system can
                                            use their pedigree to determine whether your matches are
                                            inbred. We can&#39;t get this data from TFO, so it&#39;s
                                            up to you to log it!
                                        </li>
                                        <li>
                                            <strong>Viewing Logs:</strong> Click the &#34;Logs&#34;
                                            button on a pair&#39;s card to see a history of all
                                            breeding events, including notes and linked progeny.
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
