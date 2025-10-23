import { getHomepageStats } from '@/lib/data';
import { HomePageClient } from './home/page-client';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const stats = await getHomepageStats();
    return <HomePageClient stats={stats} />;
}
