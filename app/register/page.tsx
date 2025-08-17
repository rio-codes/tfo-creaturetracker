"use client"

import type React from "react"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"


export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
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
    if (!formData.username || !formData.email || !formData.password) {
      setError('Username, email and password are required.');
      return;
    }
    if (formData.password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
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
    <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-3xl">🧬</div>
            <h1 className="text-3xl font-bold text-pompaca-purple">TFO.creaturetracker</h1>
          </div>
          <p className="text-pompaca-purple">a breeding tracker for The Final Oupost</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg">
          <CardHeader className="text-center">
              <CardTitle className="text-2xl text-pompaca-purple">Create Account</CardTitle>
            <CardDescription className="text-pompaca-purple">Join and track your breeding goals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-pompaca-purple font-medium">
                  Email
                </Label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple rounded-lg px-2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-pompaca-purple font-medium">
                  Username
                </Label>
                <input
                  id="username"
                  type="username"
                  placeholder="your TFO username"
                  value={formData.username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple rounded-lg px-2"
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
                  className="bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple rounded-lg px-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  className="border-pompaca-purple"
                />
                <Label htmlFor="terms" className="text-sm text-pompaca-purple">
                  I agree to the{" "}
                  <Link href="/terms" className="text-dusk-purple hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-dusk-purple hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-pompaca-purple hover:bg-dusk-purple text-barely-lilac"
                disabled={!formData.agreeToTerms}
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
    </div>
  </div>
  )
}
