'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    Form,
    FormControl,
    FormDescription,
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

// This schema should align with the one in `app/api/settings/route.ts`
const settingsFormSchema = z
    .object({
        email: z.string().email().optional(),
        password: z
            .string()
            .min(12, 'Password must be at least 12 characters.')
            .optional()
            .or(z.literal('')),
        collectionItemsPerPage: z.number().min(3).max(30),
        goalsItemsPerPage: z.number().min(3).max(30),
        pairsItemsPerPage: z.number().min(3).max(30),
        theme: z.enum(['light', 'dark', 'system']),
        goalConversions: z.any().optional(),
        bio: z.string().max(500, 'Bio must be 500 characters or less.').optional().nullable(),
        featuredCreatureIds: z
            .array(z.string())
            .max(3, 'You can only feature up to 3 creatures.')
            .optional(),
        featuredGoalIds: z
            .array(z.string())
            .max(3, 'You can only feature up to 3 research goals.')
            .optional(),
        pronouns: z
            .string()
            .max(50, 'Pronouns must be 50 characters or less.')
            .optional()
            .nullable(),
        socialLinks: z.string().optional(),
        showLabLink: z.boolean().optional(),
        statusMessage: z
            .string()
            .max(80, 'Status message must be 80 characters or less.')
            .optional()
            .nullable(),
        statusEmoji: z.string().max(4, 'Invalid emoji.').optional().nullable(),
        showStats: z.boolean().optional(),
        confirmPassword: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match.",
        path: ['confirmPassword'],
    });

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
    user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
    const { update } = useSession();
    const router = useRouter();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image as any);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            email: user.email as string,
            bio: (user.bio as string).trim() || ('' as string),
            theme: user.theme as 'light' | 'dark' | 'system',
            collectionItemsPerPage: user.collectionItemsPerPage,
            goalsItemsPerPage: user.goalsItemsPerPage,
            pairsItemsPerPage: user.pairsItemsPerPage,
            password: '' as string,
            confirmPassword: '' as string,
            featuredCreatureIds: user.featuredCreatureIds as string[],
            featuredGoalIds: user.featuredGoalIds as string[],
            pronouns: user.pronouns,
            socialLinks: user.socialLinks?.join('\n') || '',
            showLabLink: user.showLabLink,
            statusMessage: user.statusMessage,
            statusEmoji: user.statusEmoji,
            showStats: user.showStats,
        },
    });

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('File Too Large', {
                    description: 'Please select an image smaller than 2MB.',
                });
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: SettingsFormValues) => {
        setIsSubmitting(true);

        // Don't send password if it's empty
        const { confirmPassword, socialLinks: socialLinksString, ...restOfData } = data;
        const socialLinks = socialLinksString
            ? socialLinksString.split('\n').filter((link) => link.trim() !== '')
            : [];

        const updateData = { ...restOfData, socialLinks };

        if (!updateData.password) {
            delete updateData.password;
        }

        try {
            // 1. Upload avatar if a new one is selected
            let newImageUrl: string | null = null;
            if (avatarFile) {
                const uploadResponse = await fetch(
                    `/api/avatar/upload?filename=${encodeURIComponent(avatarFile.name)}`,
                    {
                        method: 'POST',
                        body: avatarFile,
                    }
                );

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.error || 'Failed to upload avatar.');
                }
                const blob = await uploadResponse.json();
                newImageUrl = blob.url;
            }

            // 2. Update other settings like bio
            const settingsResponse = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!settingsResponse.ok) {
                const errorData = await settingsResponse.json();
                throw new Error(errorData.error || 'Failed to update settings.');
            }

            toast.success('Settings updated successfully!');

            // Manually update the session for instant UI feedback in the header
            const sessionUpdateData: Record<string, any> = {};
            if (newImageUrl) sessionUpdateData.image = newImageUrl;
            if (updateData.theme && updateData.theme !== user.theme)
                sessionUpdateData.theme = updateData.theme;

            await update(Object.keys(sessionUpdateData).length > 0 ? sessionUpdateData : undefined);
            // Refresh server components on the page
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('An Error Occurred', {
                description: error instanceof Error ? error.message : 'Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300">
                            Public Profile
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400">
                            This information will be displayed on your public profile page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarPreview ?? undefined} alt={user.username} />
                                <AvatarFallback>
                                    {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <FormLabel
                                    htmlFor="avatar-upload"
                                    className="text-pompaca-purple dark:text-barely-lilac"
                                >
                                    Custom Avatar
                                </FormLabel>
                                <Input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={handleAvatarChange}
                                    className="file:text-pompaca-purple dark:file:text-purple-300 cursor-pointer text-pompaca-purple dark:text-barely-lilac"
                                />
                                <p className="text-sm text-dusk-purple dark:text-purple-400">
                                    PNG, JPG, or GIF. 2MB max.
                                </p>
                            </div>
                        </div>
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Bio
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us a little about yourself..."
                                            className="min-h-[100px] bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                            maxLength={500}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400">
                                        You can use up to 500 characters.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pronouns"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Pronouns
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., she/her, they/them"
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="socialLinks"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Social Links
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="https://twitter.com/your_handle&#10;https://discord.com/users/your_id"
                                            className="min-h-[100px] bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400">
                                        Enter up to 5 social media links, one per line.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300">
                            Status
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400">
                            Set a status that will appear on your profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-[auto_1fr] gap-6 pt-6">
                        <FormField
                            control={form.control}
                            name="statusEmoji"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Emoji
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="✨"
                                            className="w-20 bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                            maxLength={4}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="statusMessage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Status Message
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Breeding for shinies!"
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                            maxLength={80}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300">
                            Appearance
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400">
                            Customize the look and feel of the site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="theme"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Theme
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac">
                                                <SelectValue placeholder="Select a theme" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-barely-lilac">
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400">
                                        Choose between light, dark, or your system's default theme.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center space-x-2 pt-4">
                            <FormField
                                control={form.control}
                                name="showLabLink"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                                Show TFO Lab Link on Profile
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <FormField
                                control={form.control}
                                name="showStats"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                                Show Statistics on Profile
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300">
                            Account Security
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400">
                            Update your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        New Password
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400">
                                        Leave blank to keep your current password. Must be at least
                                        12 characters.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Confirm New Password
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300">
                            Display Preferences
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400">
                            Set the number of items to display per page. You can choose between 3
                            and 30.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-3 gap-6 pt-6">
                        <FormField
                            control={form.control}
                            name="collectionItemsPerPage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Collection Items
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="30"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="goalsItemsPerPage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Research Goals
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="30"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pairsItemsPerPage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac">
                                        Breeding Pairs
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="30"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple border-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-pompaca-purple text-barely-lilac hover:bg-pompaca-purple/90 dark:bg-ebena-lavender dark:text-pompaca-purple dark:hover:bg-ebena-lavender/90"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Form>
    );
}
