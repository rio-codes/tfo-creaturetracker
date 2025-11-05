import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { checklists } from '@/src/db/schema';
import { z } from 'zod';
import { hasObscenity } from '@/lib/obscenity';
import { logUserAction } from '@/lib/user-actions';
import { revalidatePath } from 'next/cache';

const targetGeneSchema = z.object({
    category: z.string(),
    geneCount: z.number().int().min(1).max(3),
});

const createChecklistSchema = z
    .object({
        name: z.string().min(3, 'Name must be at least 3 characters.').max(100),
        species: z.string(),
        targetGenes: z.array(targetGeneSchema).nonempty('You must select at least one gene.'),
        isPublic: z.boolean().optional().default(true),
    })
    .superRefine((data, ctx) => {
        const { targetGenes } = data;
        const trihybridCount = targetGenes.filter((g) => g.geneCount === 3).length;
        const otherCount = targetGenes.length - trihybridCount;

        if (trihybridCount > 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Cannot select more than one tri-hybrid gene.',
                path: ['targetGenes'],
            });
        }
        if (trihybridCount === 1 && otherCount > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Cannot select other genes with a tri-hybrid gene.',
                path: ['targetGenes'],
            });
        }
        if (trihybridCount === 0 && otherCount > 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Cannot select more than two mono-hybrid or di-hybrid genes.',
                path: ['targetGenes'],
            });
        }
    });

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedFields = createChecklistSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, species, targetGenes, isPublic } = validatedFields.data;

        if (hasObscenity(name)) {
            return NextResponse.json(
                { error: 'Checklist name contains inappropriate language.' },
                { status: 400 }
            );
        }

        const [newChecklist] = await db
            .insert(checklists)
            .values({
                userId: session.user.id,
                name,
                species,
                targetGenes,
                isPublic,
            })
            .returning();

        await logUserAction({
            action: 'checklist.create',
            description: `Created checklist "${name}"`,
            link: `/checklists/${newChecklist.id}`,
        });

        revalidatePath('/checklists');

        return NextResponse.json(newChecklist, { status: 201 });
    } catch (error) {
        console.error('Failed to create checklist:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const userChecklists = await db.query.checklists.findMany({
            where: (checklists, { eq }) => eq(checklists.userId, session.user.id),
            orderBy: (checklists, { desc }) => [desc(checklists.createdAt)],
        });

        return NextResponse.json(userChecklists);
    } catch (error) {
        console.error('Failed to fetch checklists:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
