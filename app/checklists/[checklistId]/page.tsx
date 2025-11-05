import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getChecklistById, getAllCreaturesForUser } from '@/lib/data';
import { ChecklistDetailClient } from '@/components/custom-clients/checklist-detail-client';

type PageProps = {
    params: {
        checklistId: string;
    };
};

export default async function ChecklistDetailPage({ params }: PageProps) {
    const session = await auth();
    const listParams = await params;
    const checklist = await getChecklistById(listParams.checklistId);

    if (!checklist) {
        notFound();
    }

    const isOwner = session?.user?.id === checklist.userId;
    const allCreatures = isOwner ? await getAllCreaturesForUser() : [];

    return (
        <ChecklistDetailClient
            checklist={checklist}
            allCreatures={allCreatures}
            isOwner={isOwner}
        />
    );
}
