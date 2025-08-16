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
      <div className="bg-purple-light min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="bg-purple-card border-purple-400 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-purple-900">Check Your Email</CardTitle>
              <CardDescription className="text-purple-700">We've sent a password reset link to {email}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-purple-700 mb-4">If you don't see the email, check your spam folder or try again.</p>
              <Link href="/login">
                <Button className="bg-purple-700 hover:bg-purple-800 text-white">Back to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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

        {/* Forgot Password Form */}
        <Card className="bg-purple-card border-purple-400 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-900">Reset Password</CardTitle>
            <CardDescription className="text-purple-700">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
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
              <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800 text-white">
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-purple-700 hover:underline">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
