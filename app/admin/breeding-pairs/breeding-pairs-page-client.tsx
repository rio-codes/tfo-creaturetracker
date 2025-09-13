'use client';

import { Suspense, useState } from 'react';
import { AdminDataTable } from '@/components/custom-tables/admin-data-table';
import { columns } from './columns';
import { ViewItemDialog } from '@/components/custom-dialogs/view-item-dialog';

export function BreedingPairsPageClient({
    pairs,
    pagination,
}: {
    pairs: any[];
    pagination: { totalPages: number };
}) {
    const [selectedItem, setSelectedItem] = useState<{
        type: string;
        id: string;
    } | null>(null);

    return (
        <>
            <AdminDataTable
                columns={columns}
                data={pairs}
                pagination={pagination}
                searchPlaceholder="Filter by name or owner..."
                onRowClick={(row: any) => setSelectedItem({ type: 'breeding-pair', id: row.id })}
            />
            <Suspense>
                {selectedItem && (
                    <ViewItemDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
                )}
            </Suspense>
        </>
    );
}
