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
import type { EnrichedResearchGoal } from '@/types';

const formSchema = z.object({
    name: z
        .string()
        .min(3, 'Goal name must be at least 3 characters.')
        .max(32, 'Goal name can not be more than 32 characters.'),
});

type ResearchGoalFormProps = {
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
    onDelete?: () => Promise<void>;
    isSubmitting: boolean;
    apiError: string | null;
    initialData: EnrichedResearchGoal;
};

export function ResearchGoalForm({
    onSubmit,
    onDelete,
    isSubmitting,
    apiError,
    initialData,
}: ResearchGoalFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData.name || '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Goal Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., Perfect Steppes"
                                    {...field}
                                />
                            </FormControl>
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
                                className="border-2 border-destructive text-destructive"
                            >
                                Delete Goal
                            </Button>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-pompaca-purple text-barely-lilac"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Goal'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
