'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';

const reportFormSchema = z.object({
    reason: z
        .string()
        .min(10, 'Please provide a reason of at least 10 characters.')
        .max(1000, 'Reason cannot exceed 1000 characters.'),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface ReportUserButtonProps {
    reportedUserId: string;
    reportedUsername: string;
}

export function ReportUserButton({ reportedUserId, reportedUsername }: ReportUserButtonProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            reason: '',
        },
    });

    const onSubmit = async (data: ReportFormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportedUserId,
                    reason: data.reason,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit report.');
            }

            toast.success('Report Submitted', {
                description: 'Thank you for helping keep the community safe.',
            });
            setOpen(false);
            form.reset();
        } catch (error) {
            toast.error('Submission Failed', {
                description: error instanceof Error ? error.message : 'Please try again later.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Flag className="mr-2 h-4 w-4" /> Report User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-ebena-lavender dark:bg-pompaca-purple">
                <DialogHeader>
                    <DialogTitle>Report {reportedUsername}</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for your report. All reports are reviewed by an
                        administrator.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe the issue..."
                                            className="min-h-[100px] bg-barely-lilac dark:bg-midnight-purple"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
