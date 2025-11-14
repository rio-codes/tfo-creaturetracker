import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';

export default function Page() {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');

    return (
        <div className="bg-barely-lilac text-pompaca-purple dark:bg-deep-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson min-h-screen flex items-center justify-center px-4 py-5">
            <div className="w-full">
                <Card className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss w-full shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">TFO.creaturetracker Changelog</CardTitle>
                        <CardDescription className="text-xl">
                            Last Updated: {new Date().toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent
                        className="flex-col py-5 text-md prose dark:prose-invert
                        prose-h1:font-bold prose-h1:text-xl
                        prose-a:text-blue-600 prose-p:text-justify prose-img:rounded-xl
                        prose-headings:underline"
                    >
                        <Markdown>{changelogContent}</Markdown>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
