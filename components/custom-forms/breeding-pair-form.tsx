'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { EnrichedCreature, EnrichedResearchGoal } from '@/types';
import { useMemo } from 'react';

const formSchema = z.object({
    pairName: z
        .string()
        .min(3, 'Pair name must be at least 3 characters.')
        .max(32, 'Pair name can not be more than 32 characters.'),
    species: z.string(),
    maleParentId: z.string().uuid('You must select a male parent.'),
    femaleParentId: z.string().uuid('You must select a female parent.'),
    assignedGoalIds: z.array(z.string().uuid()).optional(),
});

type BreedingPairFormProps = {
    allCreatures: EnrichedCreature[];
    allGoals: EnrichedResearchGoal[];
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
    onDelete?: () => Promise<void>;
    isSubmitting: boolean;
    apiError: string | null;
    initialData?: Partial<z.infer<typeof formSchema>> & { id?: string };
    baseCreature?: EnrichedCreature;
};

export function BreedingPairForm({
    allCreatures,
    allGoals,
    onSubmit,
    onDelete,
    isSubmitting,
    apiError,
    initialData = {},
    baseCreature,
}: BreedingPairFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pairName: initialData.pairName || '',
            species: initialData.species || baseCreature?.species || '',
            maleParentId:
                initialData.maleParentId ||
                (baseCreature?.gender === 'male' ? baseCreature.id : undefined),
            femaleParentId:
                initialData.femaleParentId ||
                (baseCreature?.gender === 'female'
                    ? baseCreature.id
                    : undefined),
            assignedGoalIds: initialData.assignedGoalIds || [],
        },
    });

    const selectedMaleId = form.watch('maleParentId');
    const _selectedFemaleId = form.watch('femaleParentId');

    const { suitableMales, suitableFemales } = useMemo(() => {
        const males = allCreatures.filter(
            (c) => c?.gender === 'male' && c.growthLevel === 3
        );
        const females = allCreatures.filter(
            (c) => c?.gender === 'female' && c.growthLevel === 3
        );
        return { suitableMales: males, suitableFemales: females };
    }, [allCreatures]);

    const relevantGoals = useMemo(() => {
        const male = allCreatures.find((c) => c?.id === selectedMaleId);
        if (!male) return [];
        return allGoals.filter((g) => g.species === male.species);
    }, [allGoals, allCreatures, selectedMaleId]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="pairName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pair Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., Primary Steppes Pair"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="maleParentId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Male Parent</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a male" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <ScrollArea className="h-60">
                                            {suitableMales.map((c) => (
                                                <SelectItem
                                                    key={c?.id}
                                                    value={c!.id}
                                                >
                                                    {c?.creatureName || c?.code}
                                                </SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="femaleParentId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Female Parent</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a female" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <ScrollArea className="h-60">
                                            {suitableFemales.map((c) => (
                                                <SelectItem
                                                    key={c?.id}
                                                    value={c!.id}
                                                >
                                                    {c?.creatureName || c?.code}
                                                </SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="assignedGoalIds"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">
                                    Assign Research Goals
                                </FormLabel>
                            </div>
                            <ScrollArea className="h-40 w-full rounded-md border p-4">
                                {relevantGoals.length > 0 ? (
                                    relevantGoals.map((goal) => (
                                        <FormField
                                            key={goal.id}
                                            control={form.control}
                                            name="assignedGoalIds"
                                            render={({ field }) => (
                                                <FormItem
                                                    key={goal.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(
                                                                goal.id
                                                            )}
                                                            onCheckedChange={(
                                                                checked
                                                            ) => {
                                                                return checked
                                                                    ? field.onChange(
                                                                          [
                                                                              ...(field.value ||
                                                                                  []),
                                                                              goal.id,
                                                                          ]
                                                                      )
                                                                    : field.onChange(
                                                                          field.value?.filter(
                                                                              (
                                                                                  id
                                                                              ) =>
                                                                                  id !==
                                                                                  goal.id
                                                                          )
                                                                      );
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {goal.name}
                                                    </FormLabel>
                                                </FormItem>
                                            )}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-dusk-purple">
                                        No relevant goals for the selected
                                        species.
                                    </p>
                                )}
                            </ScrollArea>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {apiError && (
                    <p className="text-sm font-medium text-destructive">
                        {apiError}
                    </p>
                )}

                <div className="flex justify-between pt-4">
                    <div>
                        {onDelete && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={onDelete}
                                disabled={isSubmitting}
                            >
                                Delete Pair
                            </Button>
                        )}
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Pair'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
