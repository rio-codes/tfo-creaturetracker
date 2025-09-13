'use client';

import { Suspense, useState } from 'react';
import { AdminDataTable } from '@/components/custom-tables/admin-data-table';
import { columns } from './columns';
import { ViewItemDialog } from '@/components/custom-dialogs/view-item-dialog';

export function CreaturesPageClient({
    creatures,
    pagination,
}: {
    creatures: any[];
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
                data={creatures}
                pagination={pagination}
                searchPlaceholder="Filter by name, code, or owner..."
                onRowClick={(row: any) => setSelectedItem({ type: 'creature', id: row.id })}
            />
            <Suspense>
                {selectedItem && (
                    <ViewItemDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
                )}
            </Suspense>
        </>
    );
}
