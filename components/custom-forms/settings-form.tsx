'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { User } from '@/types';

export function SettingsForm({ user }: { user: User }) {
    const router = useRouter();
    const { update: updateSession } = useSession();

    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [collectionItems, setCollectionItems] = useState(
        user.collectionItemsPerPage
    );
    const [goalsItems, setGoalsItems] = useState(user.goalsItemsPerPage);
    const [pairsItems, setPairsItems] = useState(user.pairsItemsPerPage);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        await saveSettings();
    };

    const saveSettings = async () => {
        setIsLoading(true);
        try {
            const payload: any = {
                theme,
                collectionItemsPerPage: collectionItems,
                goalsItemsPerPage: goalsItems,
                pairsItemsPerPage: pairsItems,
            };
            if (email !== user.email) payload.email = email;
            if (password) payload.password = password;

            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok)
                setError('Failed to update settings. ' + data.error);

            setSuccessMessage(data.message);
            if (email !== user.email) await updateSession({ user: { email } }); // Session update for theme is not needed
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Account Settings Section */}
                <div className="p-6 bg-ebena-lavender dark:bg-pompaca-purple rounded-lg border border-pompaca-purple/50 text-pompaca-purple dark:text-purple-300">
                    <h2 className="text-2xl font-bold mb-4">Account</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-barely-lilac dark:bg-midnight-purple"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Leave blank to keep current"
                                    className="bg-barely-lilac dark:bg-midnight-purple"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    Confirm New Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="bg-barely-lilac dark:bg-midnight-purple"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="p-6 bg-ebena-lavender dark:bg-pompaca-purple rounded-lg border border-pompaca-purple/50 text-pompaca-purple dark:text-purple-300">
                    <h2 className="text-2xl font-bold text-pompaca-purple mb-4">
                        Preferences
                    </h2>
                    <div className="space-y-2 mb-6">
                        <Label className="text-lg">Theme</Label>
                        {!mounted ? (
                            <div className="h-10 w-full animate-pulse rounded-md bg-pompaca-purple/20" />
                        ) : (
                            <RadioGroup
                                value={theme}
                                onValueChange={setTheme}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="light" id="light" />
                                    <Label
                                        htmlFor="light"
                                        className="font-normal"
                                    >
                                        Light
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dark" id="dark" />
                                    <Label
                                        htmlFor="dark"
                                        className="font-normal"
                                    >
                                        Dark
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="system"
                                        id="system"
                                    />
                                    <Label
                                        htmlFor="system"
                                        className="font-normal"
                                    >
                                        System
                                    </Label>
                                </div>
                            </RadioGroup>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="collection-items"
                                className="text-lg"
                            >
                                Items per page in Collection
                            </Label>
                            <Input
                                id="collection-items"
                                type="number"
                                value={collectionItems}
                                onChange={(e) =>
                                    setCollectionItems(Number(e.target.value))
                                }
                                min="3"
                                max="30"
                                className="bg-barely-lilac dark:bg-midnight-purple"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="research-goal-items"
                                className="text-lg"
                            >
                                Items per page in Research Goals
                            </Label>
                            <Input
                                id="research-goal-items"
                                type="number"
                                value={goalsItems}
                                onChange={(e) =>
                                    setGoalsItems(Number(e.target.value))
                                }
                                min="3"
                                max="30"
                                className="bg-barely-lilac dark:bg-midnight-purple"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="breeding-pair-items"
                                className="text-lg"
                            >
                                Items per page in Breeding Pairs
                            </Label>
                            <Input
                                id="breeding-pair-items"
                                type="number"
                                value={pairsItems}
                                onChange={(e) =>
                                    setPairsItems(Number(e.target.value))
                                }
                                min="3"
                                max="30"
                                className="bg-barely-lilac dark:bg-midnight-purple"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4">
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {successMessage && (
                        <p className="text-sm text-green-600">
                            {successMessage}
                        </p>
                    )}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac"
                    >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </form>
        </>
    );
}
