import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'; // prettier-ignore
import { Progress } from '@/components/ui/progress';
import { Target, Sparkles } from 'lucide-react';
import { SpeciesAvatar } from '@/components/misc-custom-components/species-avatar';
import { EnrichedChecklist } from '@/types';

type ChecklistCardProps = {
    checklist: EnrichedChecklist;
};

export function ChecklistCard({ checklist }: ChecklistCardProps) {
    const { id, name, species, progress, hasFulfillableSlots } = checklist;
    const percentage = progress.total > 0 ? (progress.filled / progress.total) * 100 : 0;

    return (
        <Card className="relative bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet flex flex-col h-full transition-transform duration-200 ease-in-out hover:scale-105">
            <Link href={`/checklists/${id}`} className="flex flex-col h-full">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <SpeciesAvatar species={species} className="w-16 h-16" />
                    <div className="flex-1">
                        {hasFulfillableSlots && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                                <Sparkles className="w-3 h-3" />
                                <span>Match Found!</span>
                            </div>
                        )}
                        <CardTitle className="text-lg leading-tight">{name}</CardTitle>
                        <CardDescription>{species}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    {/* Content can go here if needed in the future */}
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-2 pt-4">
                    <div className="flex justify-between w-full text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            Progress
                        </span>
                        <span>
                            {progress.filled} / {progress.total}
                        </span>
                    </div>
                    <Progress value={percentage} className="w-full" />
                </CardFooter>
            </Link>
        </Card>
    );
}
