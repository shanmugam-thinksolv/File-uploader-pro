"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertCircle, X } from "lucide-react"

export default function AdminLoginPage() {
    const { data: session, status } = useSession()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [step, setStep] = useState<"email" | "password">("email")
    const [mode, setMode] = useState<"login" | "signup">("login")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam) {
            if (errorParam === 'OAuthAccountNotLinked') {
                setError('This email is already associated with another account. Please try signing in with Google again.')
            } else if (errorParam === 'OAuthSignin') {
                setError('Error occurred during sign in. Please try again.')
            } else if (errorParam === 'OAuthCallback') {
                setError('Error occurred in the callback. Please try again.')
            } else if (errorParam === 'OAuthCreateAccount') {
                setError('Could not create account. Please try again.')
            } else {
                setError('An error occurred during authentication. Please try again.')
            }
            // Clear error from URL
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('error')
            router.replace(newUrl.pathname + newUrl.search)
        }
    }, [searchParams, router])

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/admin/dashboard")
        }
    }, [status, router])

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault()
        if (email) {
            setStep("password")
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Mock login for now
        setTimeout(() => {
            setIsLoading(false)
            router.push("/admin/dashboard")
        }, 1000)
    }

    const toggleMode = () => {
        setMode(mode === "login" ? "signup" : "login")
        setStep("email")
        setPassword("")
    }

    const handleGoogleSignIn = async () => {
        setError(null) // Clear any previous errors
        setIsLoading(true)
        try {
            const signInOptions: any = {
                callbackUrl: "/admin/dashboard",
            }

            if (mode === "signup") {
                // For sign-up: Force consent to get Google Drive permissions
                // We pass this via the authorization parameter which overrides the provider default
                signInOptions.authorization = {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            } else {
                // For sign-in: Use select_account prompt (quick login)
                signInOptions.authorization = {
                    params: {
                        prompt: "select_account",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            }

            await signIn("google", signInOptions)
        } catch (error) {
            console.error("Google sign-in exception:", error)
            setError("Failed to sign in. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="flex justify-center mb-6">
                        <div className="p-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--primary-600)' }}>
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                        {mode === "login" ? "Welcome" : "Create an account"}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                        {mode === "login"
                            ? "Enter your email to sign in to your account"
                            : "Enter your email to get started"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-800 font-medium">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-800 flex-shrink-0"
                                aria-label="Dismiss error"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        className="w-full h-11 font-medium text-gray-700 border-gray-300 hover:bg-gray-50"
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                    >
                        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                        {isLoading ? "Signing in..." : `Sign ${mode === "login" ? "in" : "up"} with Google`}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={step === "email" ? handleContinue : handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            {step === "email" ? (
                                <div className="space-y-1">
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-11"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                                        <span className="text-sm text-gray-600 font-medium">{email}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setStep("email")}
                                            className="h-auto p-0 px-2 font-medium"
                                            style={{ color: 'var(--primary-600)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-700)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-600)'}
                                            type="button"
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <Button className="w-full h-11 text-white font-semibold" type="submit" disabled={isLoading} style={{ backgroundColor: 'var(--primary-600)' }} onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'var(--primary-700)')} onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = 'var(--primary-600)')}>
                            {isLoading
                                ? "Processing..."
                                : step === "email"
                                    ? "Continue"
                                    : mode === "login" ? "Sign In" : "Create Account"
                            }
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                    <div className="text-sm text-gray-500">
                        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={toggleMode}
                            className="font-semibold hover:underline focus:outline-none"
                            style={{ color: 'var(--primary-600)' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-500)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary-600)'}
                        >
                            {mode === "login" ? "Sign up" : "Log in"}
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}