import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { blogPosts, users } from '@/src/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
    try {
        const posts = await db
            .select({
                id: blogPosts.id,
                title: blogPosts.title,
                content: blogPosts.content,
                createdAt: blogPosts.createdAt,
                author: {
                    username: users.username,
                    flair: users.supporterTier,
                },
            })
            .from(blogPosts)
            .leftJoin(users, eq(blogPosts.authorId, users.id))
            .orderBy(desc(blogPosts.createdAt));

        return NextResponse.json(posts);
    } catch (error) {
        console.error('Failed to fetch blog posts:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
