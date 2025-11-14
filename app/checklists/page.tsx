import { getAllCreaturesForUser, getChecklists } from '@/lib/data';
import { ChecklistsClient } from '@/components/custom-clients/checklists-client';

export const dynamic = 'force-dynamic';

export default async function ChecklistsPage() {
    const checklists = await getChecklists();
    const allCreatures = await getAllCreaturesForUser();

    return (
        <>
            <ChecklistsClient checklists={checklists as any} allCreatures={allCreatures as any} />
        </>
    );
}
