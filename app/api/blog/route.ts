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
                authorUsername: users.username,
                authorFlair: users.supporterTier,
            })
            .from(blogPosts)
            .leftJoin(users, eq(blogPosts.authorId, users.id))
            .orderBy(desc(blogPosts.createdAt));

        const formattedPosts = posts.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            createdAt: post.createdAt,
            author: {
                username: post.authorUsername,
                flair: post.authorFlair,
            },
        }));

        return NextResponse.json(formattedPosts);
    } catch (error) {
        console.error('Failed to fetch blog posts:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
