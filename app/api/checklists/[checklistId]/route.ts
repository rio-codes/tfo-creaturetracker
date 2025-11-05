import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { checklists } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { hasObscenity } from '@/lib/obscenity';
import { logUserAction } from '@/lib/user-actions';
import { revalidatePath } from 'next/cache';

const updateChecklistSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters.').max(100).optional(),
    isPublic: z.boolean().optional(),
});

export async function GET(req: Request, { params }: { params: { checklistId: string } }) {
    try {
        const checklist = await db.query.checklists.findFirst({
            where: eq(checklists.id, params.checklistId),
            with: {
                user: {
                    columns: {
                        username: true,
                    },
                },
            },
        });

        if (!checklist) {
            return NextResponse.json({ error: 'Checklist not found.' }, { status: 404 });
        }

        // A session is not required to view a public checklist
        const session = await auth();
        if (!checklist.isPublic && checklist.userId !== session?.user?.id) {
            return NextResponse.json(
                { error: 'Not authorized to view this checklist.' },
                { status: 403 }
            );
        }

        return NextResponse.json(checklist);
    } catch (error) {
        console.error('Failed to fetch checklist:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { checklistId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedFields = updateChecklistSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, isPublic } = validatedFields.data;

        if (name && hasObscenity(name)) {
            return NextResponse.json(
                { error: 'Checklist name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const [updatedChecklist] = await db
            .update(checklists)
            .set({
                name,
                isPublic,
                updatedAt: new Date(),
            })
            .where(
                and(eq(checklists.id, params.checklistId), eq(checklists.userId, session.user.id))
            )
            .returning();

        if (!updatedChecklist) {
            return NextResponse.json(
                { error: 'Checklist not found or you do not have permission to edit it.' },
                { status: 404 }
            );
        }

        await logUserAction({
            action: 'checklist.update',
            description: `Updated checklist "${updatedChecklist.name}"`,
            link: `/checklists/${updatedChecklist.id}`,
        });

        revalidatePath(`/checklists/${params.checklistId}`);
        revalidatePath(`/${session.user.username}`);

        return NextResponse.json(updatedChecklist);
    } catch (error) {
        console.error('Failed to update checklist:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { checklistId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const [deletedChecklist] = await db
            .delete(checklists)
            .where(
                and(eq(checklists.id, params.checklistId), eq(checklists.userId, session.user.id))
            )
            .returning();

        if (!deletedChecklist) {
            return NextResponse.json(
                { error: 'Checklist not found or you do not have permission to delete it.' },
                { status: 404 }
            );
        }

        await logUserAction({
            action: 'checklist.delete',
            description: `Deleted checklist "${deletedChecklist.name}"`,
        });

        revalidatePath('/checklists');
        revalidatePath(`/${session.user.username}`);

        return NextResponse.json({ message: 'Checklist deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete checklist:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
