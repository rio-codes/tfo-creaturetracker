"use client"

import type React from "react"
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"

interface registerFormInput {
  username: string
  email: string
  password: string
}

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<registerFormInput>({
    defaultValues: {
      username: "",
      email: "",
      password: ""
    }
  })

  const submitToDatabase = async (formData) => {
    try {
      console.log("Submitting form with data ", formData);
      alert("Submitting form");
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'username': formData.username, 
          'email': formData.email, 
          'password': formData.password
        })
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
  }

  const onErrors = (errors) => {
    console.error("VALIDATION ERRORS:", errors);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="bg-barely-lilac w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-3xl">🧬</div>
            <h1 className="text-3xl font-bold text-pompaca-purple">TFO.creaturetracker</h1>
          </div>
          <p className="text-pompaca-purple">a breeding tracker for The Final Oupost</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-ebena-lavender border-pompaca-purple shadow-lg justify-center">
          <CardHeader className="text-center">
              <CardTitle className="text-2xl text-pompaca-purple">Create Account</CardTitle>
            <CardDescription className="text-pompaca-purple">Join and track your breeding goals</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(submitToDatabase, onErrors)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-pompaca-purple font-medium">
                  Email
                </Label>
                <input
                  {...register(
                    "email",
                    {required: true})}
                  placeholder = "you@example.com"
                  className="w-full bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple rounded-lg px-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-pompaca-purple font-medium">
                  Username
                </Label>
                <input
                  {...register(
                    "username",
                    {required: true})}
                  placeholder="your TFO username"
                  className="w-full bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple rounded-lg px-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-pompaca-purple font-medium">
                  Password
                </Label>
                <input
                  {...register(
                    "password",
                    {
                      required: true,
                      min: 12
                    }
                  )}
                  type = "password"
                  placeholder="••••••••"
                  className="w-full bg-barely-lilac border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple rounded-lg px-2"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id = "terms"
                  defaultChecked = {false}
                  onCheckedChange={event => {
                    const isChecked = typeof event === "boolean" ? event : event.target.checked;
                    setAgreeToTerms(isChecked);
                  }}
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
      </div>
    </div>
  )
}
