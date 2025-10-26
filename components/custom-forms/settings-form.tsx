'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
import type { User } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Theme as EmojiTheme, EmojiStyle } from 'emoji-picker-react';
import { hasObscenity } from '@/lib/obscenity';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const settingsFormSchema = z
    .object({
        email: z.string().email().optional(),
        password: z
            .string()
            .min(12, 'Password must be at least 12 characters.')
            .optional()
            .or(z.literal('')),
        collectionItemsPerPage: z
            .number({ message: 'Must be a number.' })
            .min(3, 'Must be between 3 and 30.')
            .max(30, 'Must be between 3 and 30.')
            .optional(),
        goalsItemsPerPage: z
            .number({ message: 'Must be a number.' })
            .min(3, 'Must be between 3 and 30.')
            .max(30, 'Must be between 3 and 30.')
            .optional(),
        pairsItemsPerPage: z
            .number({ message: 'Must be a number.' })
            .min(3, 'Must be between 3 and 30.')
            .max(30, 'Must be between 3 and 30.')
            .optional(),
        theme: z.enum(['light', 'dark', 'system', 'hallowsnight']).optional(),
        goalConversions: z.any().optional(), // This field is not directly used in the form but is part of the user object
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
        socialLinks: z.string().optional().nullable(),
        showLabLink: z.boolean().optional(),
        statusMessage: z
            .string()
            .max(80, 'Status message must be 80 characters or less.')
            .optional()
            .nullable(),
        statusEmoji: z.string().max(4, 'Invalid emoji.').optional().nullable(),
        showStats: z.boolean().optional(),
        showFriendsList: z.boolean().optional(),
        preserveFilters: z.boolean().optional(),
        showFulfillable: z.boolean().optional(),
        allowWishlistGoalSaving: z.boolean().optional(),
        confirmPassword: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.password) {
                return data.password === data.confirmPassword;
            }
            return true;
        },
        { message: "Passwords don't match.", path: ['confirmPassword'] }
    );

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
    user: User;
}

const EmojiPicker = dynamic(
    () => {
        return import('emoji-picker-react');
    },
    { ssr: false }
);

export function SettingsForm({ user }: SettingsFormProps) {
    const { update } = useSession();
    const router = useRouter();
    const { theme } = useTheme();
    const [avatarFile, setAvatarFile] = useState<File | null>(null); // State for the selected avatar file
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image as any);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            email: user.email ?? '',
            collectionItemsPerPage: user.collectionItemsPerPage ?? 10,
            goalsItemsPerPage: user.goalsItemsPerPage ?? 10,
            pairsItemsPerPage: user.pairsItemsPerPage ?? 10,
            theme: user.theme ?? 'system',
            bio: user.bio ?? '',
            pronouns: user.pronouns ?? '',
            socialLinks: user.socialLinks?.filter((link) => link).join('\n') ?? '',
            statusMessage: user.statusMessage ?? '',
            statusEmoji: user.statusEmoji ?? '✨',
            showLabLink: user.showLabLink ?? false,
            showStats: user.showStats ?? false,
            showFriendsList: user.showFriendsList ?? false,
            preserveFilters: user.preserveFilters ?? false,
            showFulfillable: user.showFulfillable ?? false,
            allowWishlistGoalSaving: user.allowWishlistGoalSaving ?? false,
        },
    });

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 6 * 1024 * 1024) {
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

        const { confirmPassword, socialLinks, ...restOfData } = data;

        const updateData = {
            ...restOfData,
            socialLinks: socialLinks
                ? socialLinks.split('\n').filter((link) => link.trim() !== '')
                : [],
        };

        if (!updateData.password) {
            delete updateData.password;
        }

        const fieldsToCheck = [
            { name: 'bio', value: updateData.bio, label: 'bio' },
            { name: 'pronouns', value: updateData.pronouns, label: 'pronouns' },
            {
                name: 'statusMessage',
                value: updateData.statusMessage,
                label: 'status message',
            },
        ];

        for (const field of fieldsToCheck) {
            if (await hasObscenity(field.value)) {
                toast.error('Obscenity Detected', {
                    description: `Please remove any offensive language from your ${field.label}.`,
                });
                setIsSubmitting(false);
                return;
            }
        }

        try {
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

            const sessionUpdateData: Record<string, any> = {};
            if (newImageUrl) sessionUpdateData.image = newImageUrl;
            if (updateData.theme && updateData.theme !== user.theme)
                sessionUpdateData.theme = updateData.theme;

            if (typeof updateData.preserveFilters === 'boolean') {
                localStorage.setItem('preserveFilters', String(updateData.preserveFilters));
            } else {
                localStorage.removeItem('preserveFilters');
            }

            if (typeof updateData.showFulfillable === 'boolean') {
                localStorage.setItem('showFulfillable', String(updateData.showFulfillable));
            } else {
                localStorage.removeItem('showFulfillable');
            }

            if (typeof updateData.showLabLink === 'boolean') {
                localStorage.setItem('showLabLink', String(updateData.showLabLink));
            } else {
                localStorage.removeItem('showLabLink');
            }

            if (typeof updateData.showStats === 'boolean') {
                localStorage.setItem('showStats', String(updateData.showStats));
            } else {
                localStorage.removeItem('showStats');
            }

            if (typeof updateData.showFriendsList === 'boolean') {
                localStorage.setItem('showFriendsList', String(updateData.showFriendsList));
            } else {
                localStorage.removeItem('showFriendsList');
            }

            if (typeof updateData.allowWishlistGoalSaving === 'boolean') {
                localStorage.setItem(
                    'allowWishlistGoalSaving',
                    String(updateData.allowWishlistGoalSaving)
                );
            } else {
                localStorage.removeItem('allowWishlistGoalSaving');
            }

            if (Object.keys(sessionUpdateData).length > 0) {
                localStorage.setItem('sessionUpdateData', JSON.stringify(sessionUpdateData));
            } else {
                localStorage.removeItem('sessionUpdateData');
            }

            await update(Object.keys(sessionUpdateData).length > 0 ? sessionUpdateData : undefined);
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
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Public Profile
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                            This information will be displayed on your public profile page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 ">
                                <AvatarImage
                                    className="hallowsnight:border-cimo-crimson hallowsnight:border-3 rounded-full"
                                    src={avatarPreview ?? undefined}
                                    alt={user.username}
                                />
                                <AvatarFallback>
                                    {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <FormLabel
                                    htmlFor="avatar-upload"
                                    className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                                >
                                    Custom Avatar
                                </FormLabel>
                                <Input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif"
                                    onChange={handleAvatarChange}
                                    className="file:text-pompaca-purple dark:file:text-purple-300 cursor-pointer hallowsnight:bg-blood-bay-wine text-pompaca-purple hallowsnight:file:text-cimo-crimson/75 hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
                                />
                                <p className="text-sm text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                                    PNG, JPG, or GIF. 2MB max.
                                </p>
                            </div>
                        </div>
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Bio
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us a little about yourself..."
                                            className="min-h-[100px] bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
                                            maxLength={500}
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
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
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Pronouns
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., she/her, they/them"
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
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
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Social Links
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="https://twitter.com/your_handle&#10;https://discord.com/users/your_id"
                                            className="min-h-[100px] bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                                        Enter up to 5 social media links, one per line.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center space-x-2 pt-4">
                            <FormField
                                control={form.control}
                                name="allowWishlistGoalSaving"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                Allow others to save your Wishlist goals
                                            </FormLabel>
                                            <FormDescription>
                                                Enable this to let other users save a copy of your
                                                public goals to their own collection.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Status
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                            Set a status that will appear on your profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-[auto_1fr] gap-6 pt-6">
                        <FormField
                            control={form.control}
                            name="statusEmoji"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson block">
                                        Emoji
                                    </FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className="w-20 h-10 text-2xl bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine order-pompaca-purple/50 placeholder:text-dusk-purple hallowsnight:placeholder:text-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                                                >
                                                    {field.value || '✨'}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 border-0">
                                            <EmojiPicker
                                                onEmojiClick={(emojiData) => {
                                                    field.onChange(emojiData.emoji);
                                                }}
                                                theme={theme as EmojiTheme}
                                                emojiStyle={EmojiStyle.GOOGLE}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="statusMessage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Status Message
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Just drank 3 capsules, I couldn't help myself"
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine order-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
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

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Appearance
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                            Customize the look and feel of the site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <FormField
                            control={form.control}
                            name="theme"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Theme
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine border-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                <SelectValue placeholder="Select a theme" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="hallowsnight">
                                                Hallowsnight
                                            </SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                                        Choose between light, dark, or your system&#39;s default
                                        theme. Or...choose <strong>true darkness</strong> this
                                        chilly autumn eve.
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
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
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
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                Show Statistics on Profile
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <FormField
                                control={form.control}
                                name="showFriendsList"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                Show Friends List on Profile
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <FormField
                                control={form.control}
                                name="preserveFilters"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                Preserve Filters Between Sessions
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <FormField
                                control={form.control}
                                name="showFulfillable"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                                Show &#34;Fulfills a Wish&#34; on Featured Creatures
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Account Security
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
                            Update your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        New Password
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine hallowsnight:placeholder:text-ruzafolio-scarlet border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
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
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Confirm New Password
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••••••"
                                            {...field}
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:placeholder:text-ruzafolio-scarlet hallowsnight:bg-blood-bay-wine border-pompaca-purple/50 placeholder:text-dusk-purple text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50">
                    <CardHeader>
                        <CardTitle className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Display Preferences
                        </CardTitle>
                        <CardDescription className="text-dusk-purple dark:text-purple-400 hallowsnight:text-abyss">
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
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Collection Items
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="30"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ''
                                                        ? 0
                                                        : parseInt(e.target.value, 10)
                                                )
                                            }
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine order-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
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
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Research Goals
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="30"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ''
                                                        ? 0
                                                        : parseInt(e.target.value, 10)
                                                )
                                            }
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine order-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson hallowsnight:border-cimo-crimson"
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
                                    <FormLabel className="text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                                        Breeding Pairs
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="3"
                                            max="30"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    e.target.value === ''
                                                        ? 0
                                                        : parseInt(e.target.value, 10)
                                                )
                                            }
                                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-blood-bay-wine order-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
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
                    className="bg-pompaca-purple text-barely-lilac hover:bg-pompaca-purple/90 dark:bg-ebena-lavender dark:text-pompaca-purple dark:hover:bg-ebena-lavender/90 hallowsnight:bg-blood-bay-wine hallowsnight:text-cimo-crimson hallowsnight:hover:bg-blood-bay-wine/90"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
        </Form>
    );
}
