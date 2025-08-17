"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle forgot password logic here
    console.log("Password reset request for:", email)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-pompaca-purple">Check Your Email</CardTitle>
              <CardDescription className="text-dusk-purple">We've sent a password reset link to {email}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-pompaca-purple mb-4">If you don't see the email, check your spam folder or try again.</p>
              <Link href="/login">
                <Button className="bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac">Back to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-yellow-300 text-3xl">🧬</div>
            <h1 className="text-3xl font-bold text-pompaca-purple">TFO.creaturetracker</h1>
          </div>
          <p className="text-pompaca-purple">a breeding tracker for The Final Oupost</p>
        </div>

        {/* Forgot Password Form */}
        <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-pompaca-purple">Reset Password</CardTitle>
            <CardDescription className="text-dusk-purple">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
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
