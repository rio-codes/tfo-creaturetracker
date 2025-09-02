'use client';

import { Suspense, useState } from 'react';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { columns } from './columns';
import { ViewItemDialog } from '@/components/admin/view-item-dialog';

export function ResearchGoalsPageClient({
    goals,
    pagination,
}: {
    goals: any[];
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
                data={goals}
                pagination={pagination}
                searchPlaceholder="Filter by name, species, or owner..."
                onRowClick={(row: any) =>
                    setSelectedItem({ type: 'research-goal', id: row.id })
                }
            />
            <Suspense>
                {selectedItem && (
                    <ViewItemDialog
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </Suspense>
        </>
    );
}
