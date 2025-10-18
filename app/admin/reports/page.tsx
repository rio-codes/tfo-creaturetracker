import { db } from '@/src/db';
import { reports, users } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { ReportsDataTable } from './data-table';
import { columns, EnrichedReport } from './columns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

async function getReports(): Promise<EnrichedReport[]> {
    const reporter = alias(users, 'reporter');
    const reported = alias(users, 'reported');

    const allReports = await db
        .select({
            id: reports.id,
            reason: reports.reason,
            status: reports.status,
            createdAt: reports.createdAt,
            reporter: {
                id: reporter.id,
                username: reporter.username,
            },
            reported: {
                id: reported.id,
                username: reported.username,
            },
        })
        .from(reports)
        .leftJoin(reporter, eq(reports.reporterId, reporter.id))
        .leftJoin(reported, eq(reports.reportedId, reported.id))
        .orderBy(desc(reports.createdAt));

    // Ensure usernames are not null, provide a fallback for deleted users
    return allReports.map((report) => ({
        ...report,
        reporter: {
            id: report.reporter?.id || 'unknown',
            username: report.reporter?.username || '[Deleted User]',
        },
        reported: {
            id: report.reported?.id || 'unknown',
            username: report.reported?.username || '[Deleted User]',
        },
    })) as EnrichedReport[];
}

export default async function AdminReportsPage() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        redirect('/collection');
    }

    const data = await getReports();

    return (
        <div className="container mx-auto py-10">
            <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                <CardHeader>
                    <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        User Reports
                    </CardTitle>
                    <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                        Review and manage reports submitted by users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReportsDataTable columns={columns} data={data} />
                </CardContent>
            </Card>
        </div>
    );
}
