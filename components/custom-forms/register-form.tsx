'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CheckedState } from '@radix-ui/react-checkbox';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Sentry from "@sentry/nextjs";

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password.length < 12) {
        setError('Password must be at least 12 characters long.');
        return;
        }

        try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            setSuccessMessage(data.message + " Redirecting to login...");
            setTimeout(() => router.push('/login'), 2000);
        } else {
            setError(data.message || 'An error occurred.');
        }
        } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        Sentry.captureException(err);
        }
    };

    return (
        <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl text-pompaca-purple">Create Account</CardTitle>
            <CardDescription className="text-pompaca-purple">Join and track your breeding goals</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Display success or error messages */}
            {successMessage && <p className="text-green-600 text-center mb-4">{successMessage}</p>}
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-pompaca-purple font-medium">Email</Label>
                <Input
                id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple" required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="username" className="text-pompaca-purple font-medium">Username</Label>
                <Input
                id="username" type="text" placeholder="your TFO username"
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple" required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-pompaca-purple font-medium">Password</Label>
                <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple" required
                />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox
                id="terms"
                onCheckedChange={(checked: CheckedState) => setAgreeToTerms(!!checked)}
                className="border-pompaca-purple"
                />
                <Label htmlFor="terms" className="text-sm text-pompaca-purple">
                I agree to the{" "}
                <Link href="/terms" className="text-dusk-purple hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-dusk-purple hover:underline">Privacy Policy</Link>
                </Label>
            </div>
            <Button
                type="submit"
                className="w-full bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac"
                disabled={!agreeToTerms}
            >
                Create Account
            </Button>
            </form>

            <div className="mt-6 text-center">
            <p className="text-pompaca-purple">
                Already have an account?{" "}
                <Link href="/login" className="text-dusk-purple font-medium hover:underline">
                Sign in here
                </Link>
            </p>
            </div>
        </CardContent>
        </Card>
    );
}