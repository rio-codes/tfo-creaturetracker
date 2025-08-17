"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the API returns an error, display it to the user
        throw new Error(data.error || 'Something went wrong.');
      }

      // Display the success message from the API
      setMessage(data.message);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-yellow-300 text-3xl">🧬</div>
            <h1 className="text-3xl font-bold text-pompaca-purple">Forgot your password?</h1>
          </div>
          <p className="text-pompaca-purple">Enter your email and we'll send you a link to reset your password.</p>
        </div>


        {/* Success Message */}
        {message && (
          <div className="p-3 py-3 rounded-md text-sm bg-green-100 text-green-800">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 py-3 rounded-md text-sm bg-red-100 text-red-800">
            {error}
          </div>
        )}

      
        {/* Forgot Password Form */}
        <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-pompaca-purple">Reset Password</CardTitle>
            <CardDescription className="text-dusk-purple">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
          {/* Hide the form after a successful submission */}
          {!message && (
            <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-pompaca-purple font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac">
                Send Reset Link
              </Button>
            </form>
            </>
          )}
            <div className="mt-6 text-center">
              <Link href="/login" className="text-pompaca-purple hover:underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>


  )
}
