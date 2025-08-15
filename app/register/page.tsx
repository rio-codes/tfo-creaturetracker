"use client"

import type React from "react"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Basic client-side validation
    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      return;
    }
    if (formData.password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }
    if (formData.password

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message + " Redirecting to login...");
        // Redirect to the login page after a short delay
        setTimeout(() => {
          router.push('/login'); // Assuming your login page is at /login
        }, 2000);
      } else {
        // Handle errors from the API (e.g., user already exists)
        setError(data.message || 'An error occurred.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-purple-light min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-yellow-300 text-3xl">🧬</div>
            <h1 className="text-3xl font-bold text-purple-900">TFO.creaturetracker</h1>
          </div>
          <p className="text-purple-700">a breeding tracker for The Final Oupost</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-purple-card border-purple-400 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-purple-900">Create Account</CardTitle>
            <CardDescription className="text-purple-700">Join the creature tracking community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-purple-900 font-medium">
                  Email
                </Label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-purple-200 border-purple-300 text-purple-900 placeholder:text-purple-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-900 font-medium">
                  Password
                </Label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  className="border-purple-600"
                />
                <Label htmlFor="terms" className="text-sm text-purple-900">
                  I agree to the{" "}
                  <Link href="/terms" className="text-purple-700 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-purple-700 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                disabled={!formData.agreeToTerms}
              >
                Create Account
              </Button>
            </form>

          <div className="mt-6 text-center">
            <p className="text-purple-700">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-900 font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}
