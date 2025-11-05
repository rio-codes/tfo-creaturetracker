import { getChecklists } from '@/lib/data';
import { ChecklistsClient } from '@/components/custom-clients/checklists-client';

export const dynamic = 'force-dynamic';

export default async function ChecklistsPage() {
    const checklists = await getChecklists();

    return (
        <>
            <ChecklistsClient checklists={checklists} />
        </>
    );
}
