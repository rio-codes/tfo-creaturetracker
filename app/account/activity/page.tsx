import { getUserActionLog } from '@/lib/api/user-actions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

export default async function ActivityLogPage() {
    const logs = await getUserActionLog();

    return (
        <main className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-pompaca-purple dark:text-purple-300">
                My Activity Log
            </h1>
            <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-pompaca-purple dark:text-purple-300">
                        <ScrollText className="h-6 w-6" />
                        Recent Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="divide-y divide-pompaca-purple/20">
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <li key={log.id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-pompaca-purple dark:text-barely-lilac">
                                            {log.description}
                                            {log.link && (
                                                <Link
                                                    href={log.link}
                                                    className="text-dusk-purple dark:text-purple-400 hover:underline ml-2"
                                                >
                                                    (view)
                                                </Link>
                                            )}
                                        </p>
                                        <p className="text-sm text-dusk-purple dark:text-purple-400 mt-1">
                                            {formatDistanceToNow(new Date(log.timestamp), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="p-4 text-center text-dusk-purple dark:text-purple-400">
                                You haven't performed any actions yet.
                            </li>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </main>
    );
}
