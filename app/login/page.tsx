"use client"

import type React from "react"
import { signIn } from 'next-auth/react';
import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('');
    try {
      const result = await signIn('credentials', {
        redirect: false, // Prevent NextAuth from redirecting automatically
        email,
        password,
      });

      if (result?.error) {
        // Handle different errors, e.g., "CredentialsSignin"
        setError('Invalid email or password. Please try again.');
        console.error(result.error);
      } else if (result?.ok) {
        // On successful sign-in, redirect to the dashboard or home page
        router.push('/dashboard');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="bg-purple-light min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-yellow-300 text-3xl">🧬</div>
            <h1 className="text-3xl font-bold text-purple-900">TFO.creaturetracker</h1>
          </div>
          <p className="text-purple-700">a breeding tracker for The Final Oupost</p>
        </div>

        {/* Login Form */}
        <Card className="bg-purple-card border-purple-400 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-900">Welcome Back</CardTitle>
            <CardDescription className="text-purple-700">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-900 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-purple-200 border-purple-300 text-purple-900 placeholder:text-purple-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-900 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-purple-200 border-purple-300 text-purple-900 placeholder:text-purple-600"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white">
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-purple-700">
                Don't have an account?{" "}
                <Link href="/register" className="text-purple-900 font-medium hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
