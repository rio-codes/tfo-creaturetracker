'use client';

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
import { Target, CheckCircle, Settings } from 'lucide-react';
import { SpeciesAvatar } from '@/components/misc-custom-components/species-avatar';
import { EnrichedChecklist, EnrichedCreature } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EditChecklistDialog } from '@/components/custom-dialogs/edit-checklist-dialog';

type ChecklistCardProps = {
    checklist: EnrichedChecklist;
    allCreatures: EnrichedCreature[];
};

export function ChecklistCard({ checklist, allCreatures }: ChecklistCardProps) {
    const { id, name, species, progress, hasFulfillableCreatures } = checklist;
    const percentage = progress.total > 0 ? (progress.filled / progress.total) * 100 : 0;
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    return (
        <>
            <Card className="relative bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet flex flex-col h-full transition-transform duration-200 ease-in-out hover:scale-105">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditDialogOpen(true);
                    }}
                >
                    <Settings className="w-5 h-5" />
                </Button>
                <Link href={`/checklists/${id}`} className="flex flex-col h-full">
                    <CardHeader className="flex-row items-start gap-4 space-y-0">
                        <SpeciesAvatar species={species} className="w-16 h-16" />
                        <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">{name}</CardTitle>
                            <CardDescription>{species}</CardDescription>
                        </div>
                        {hasFulfillableCreatures && (
                            <Badge className="absolute top-12 right-2 bg-green-500 text-white animate-pulse">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                New Match!
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="grow pt-0">
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
            <EditChecklistDialog
                checklist={checklist}
                allCreatures={allCreatures}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
            />
        </>
    );
}
