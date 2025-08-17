'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setMessage("Error: No reset token found.");
            return;
        }

        const response = await fetch('/api/auth/password-reset/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });

        const data = await response.json();
        setMessage(data.message || data.error);
        
        if (response.ok) {
            setTimeout(() => router.push('/login'), 2000);
        }
    };
    
    return (
        <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4">
            <div className=" w-full max-w-md">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-3xl">🧬</div>
                        <h1 className="text-3xl font-bold text-pompaca-purple">TFO.creaturetracker</h1>
                    </div>
                    <p className="text-pompaca-purple">a breeding tracker for The Final Oupost</p>
                </div>
                {/* Login Form */}
                <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl text-pompaca-purple">Welcome Back</CardTitle>
                        <CardDescription className="text-pompaca-purple">Sign in to your account to continue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-pompaca-purple font-medium">
                                New Password
                                </Label>
                                <Input
                                id="password"
                                type="password"
                                placeholder="Enter your new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                                required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac">
                                Reset
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}