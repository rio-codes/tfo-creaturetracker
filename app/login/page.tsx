'use client';

import type React from 'react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [_isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            setIsLoading(false);

            if (result?.error) {
                console.error('Sign-in failed:', result.error);
                setError('Invalid username or password. Please try again.');
            } else if (result?.ok) {
                router.push('/collection');
                router.refresh();
            }
        } catch (error) {
            setIsLoading(false);
            console.error('Sign-in function error:', error);
            setError('An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <div className="bg-barely-lilac dark:bg-midnight-purple min-h-screen flex items-center justify-center px-4">
            <div className=" w-full max-w-md">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-3xl">🧬</div>
                        <h1 className="text-3xl font-bold text-pompaca-purple dark:text-purple-300">
                            TFO.creaturetracker
                        </h1>
                    </div>
                    <p className="text-pompaca-purple dark:text-purple-300">
                        a breeding tracker for The Final Oupost
                    </p>
                </div>

                {/* Login Form */}
                <Card className="bdark:bg-pompaca-purple bg-ebena-lavender border-pompaca-purple text-pompaca-purple dark:border-purple-400 dark:text-purple-300 shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-pompaca-purple">Welcome Back</CardTitle>
                        <CardDescription className="text-pompaca-purple">
                            Sign in to your account to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-md text-sm bg-red-100 text-red-800 text-center">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="username"
                                    className="text-pompaca-purple font-medium"
                                >
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-pompaca-purple font-medium"
                                >
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac"
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-pompaca-purple">
                                Don't have an account?{' '}
                                <Link
                                    href="/register"
                                    className="text-pompaca-purple font-medium hover:underline"
                                >
                                    Sign up here
                                </Link>
                            </p>
                        </div>

                        <div className="mt-4 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-dusk-purple hover:underline"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
