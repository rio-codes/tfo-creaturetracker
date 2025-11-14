import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { blogPosts } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const { title, content } = await req.json();
        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
        }

        await db.insert(blogPosts).values({
            title,
            content,
            authorId: session.user.id,
        });

        revalidatePath('/home');
        revalidatePath('/admin/blog');

        return NextResponse.json({ message: 'Blog post created successfully.' });
    } catch (error) {
        console.error('Failed to create blog post:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
        const { id, title, content } = await req.json();
        if (!id || !title || !content) {
            return NextResponse.json(
                { error: 'ID, title and content are required.' },
                { status: 400 }
            );
        }

        await db
            .update(blogPosts)
            .set({
                title,
                content,
                updatedAt: new Date(),
            })
            .where(eq(blogPosts.id, id));

        revalidatePath('/home');
        revalidatePath('/admin/blog');

        return NextResponse.json({ message: 'Blog post updated successfully.' });
    } catch (error) {
        console.error('Failed to update blog post:', error);
        return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
    }
}
