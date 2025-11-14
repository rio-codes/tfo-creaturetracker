import { db } from '@/src/db';
import { blogPosts } from '@/src/db/schema';
import { newsItems } from '@/app/home/page-client-data';
import ReactDOMServer from 'react-dom/server';

async function main() {
    console.log('Importing blog posts...');

    for (const item of newsItems) {
        const content = ReactDOMServer.renderToStaticMarkup(item.content);
        const date = new Date(item.date.replace(/(st|nd|rd|th)/, ''));
        await db.insert(blogPosts).values({
            title: item.title,
            content: content,
            createdAt: date,
            authorId: 'ffe80f54-1202-4de1-ad3f-8414ec43c68b',
        });
    }

    console.log('Blog posts imported successfully!');
}

main().catch((err) => {
    console.error('Failed to import blog posts:', err);
    process.exit(1);
});
