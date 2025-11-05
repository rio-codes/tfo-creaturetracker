import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/src/db';
import { checklists, creatures } from '@/src/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const assignCreatureSchema = z.object({
    phenotypeString: z.string(),
    creature: z
        .object({
            userId: z.string(),
            code: z.string(),
        })
        .nullable(),
});

export async function POST(req: Request, { params }: { params: { checklistId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const checklistParams = await params;
    const checklistId = checklistParams.checklistId;

    console.log(checklistParams);

    try {
        const body = await req.json();
        console.log(body);
        const validatedFields = assignCreatureSchema.safeParse(body);

        if (!validatedFields.success) {
            return NextResponse.json(
                { error: validatedFields.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { phenotypeString, creature: creatureIdentifier } = validatedFields.data;

        console.log(creatureIdentifier);

        const checklist = await db.query.checklists.findFirst({
            where: and(eq(checklists.id, checklistId), eq(checklists.userId, session.user.id)),
        });

        console.log(checklist);

        if (!checklist) {
            return NextResponse.json(
                { error: 'Checklist not found or you do not have permission to edit it.' },
                { status: 404 }
            );
        }

        if (creatureIdentifier) {
            const creatureExists = await db.query.creatures.findFirst({
                where: and(
                    eq(creatures.userId, creatureIdentifier.userId),
                    eq(creatures.code, creatureIdentifier.code)
                ),
            });
            if (!creatureExists) {
                return NextResponse.json(
                    { error: 'The selected creature does not exist.' },
                    { status: 404 }
                );
            }
        }

        console.log(checklist.assignments);

        const currentAssignments = checklist.assignments as Record<
            string,
            { userId: string; code: string } | null
        >;
        currentAssignments[phenotypeString] = creatureIdentifier;
        console.log('currentAssignments ', currentAssignments);

        await db
            .update(checklists)
            .set({
                assignments: currentAssignments,
                updatedAt: new Date(),
            })
            .where(eq(checklists.id, checklistId));

        console.log('updated db');

        revalidatePath(`/checklists/${checklistId}`);

        return NextResponse.json({ message: 'Checklist updated successfully.' });
    } catch (error) {
        console.error('Failed to assign creature to checklist:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
