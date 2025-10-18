'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [_error, setError] = useState('');
    const [_successMessage, setSuccessMessage] = useState('');
    const [_isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!token) {
            setError('Could not submit: No reset token found.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/password-reset/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Ensure the body has the EXACT keys: "token" and "password"
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'An unknown error occurred.');
            }

            setSuccessMessage(data.message);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-barely-lilac dark:bg-deep-purple min-h-screen flex items-center justify-center px-4">
            <div className=" w-full max-w-md">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-3xl">🧬</div>
                        <h1 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            TFO.creaturetracker
                        </h1>
                    </div>
                    <p className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                        a breeding tracker for The Final Oupost
                    </p>
                </div>
                {/* Reset Form */}
                <Card className="bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple dark:border-purple-400 shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                            Reset Your Password
                        </CardTitle>
                        <CardDescription className="text-pompaca-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine">
                            Enter your new password below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson font-medium"
                                >
                                    New Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson placeholder:text-dusk-purple dark:placeholder:text-purple-400"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson font-medium"
                                >
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss border-pompaca-purple dark:border-purple-400 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson placeholder:text-dusk-purple dark:placeholder:text-purple-400"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                            >
                                Reset
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
