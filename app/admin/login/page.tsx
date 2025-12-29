"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, X } from "lucide-react"

export default function AdminLoginPage() {
    const { data: session, status } = useSession()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam) {
            if (errorParam === 'OAuthAccountNotLinked') {
                setError('This email is already associated with another account.')
            } else {
                setError('Sign in failed. Please try again.')
            }
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

    const handleGoogleSignIn = async () => {
        setError(null)
        setIsLoading(true)
        try {
            await signIn("google", {
                callbackUrl: "/admin/dashboard",
                authorization: {
                    params: {
                        prompt: "select_account",
                        access_type: "offline",
                    }
                }
            })
        } catch (error) {
            setError("Failed to sign in. Please try again.")
            setIsLoading(false)
        }
    }

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        
        // Mock login - replace with actual implementation
        setTimeout(() => {
            setIsLoading(false)
            router.push("/admin/dashboard")
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'linear-gradient(to bottom right, var(--primary-600), var(--primary-700))' }}>
                        <span className="text-white font-bold text-lg">F</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in</h1>
                    <p className="text-gray-600">Continue to your account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Google Sign In */}
                <Button
                    variant="outline"
                    className="w-full h-12 font-medium border-gray-300 hover:bg-gray-50 mb-4"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Continue with Google
                </Button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-50 px-4 text-gray-500">Or</span>
                    </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12"
                        autoFocus
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12"
                    />
                    <Button 
                        className="w-full h-12 font-semibold text-white" 
                        type="submit" 
                        disabled={isLoading}
                        style={{ background: 'linear-gradient(to right, var(--primary-600), var(--primary-700))' }}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button
                        onClick={handleGoogleSignIn}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--primary-600)' }}
                    >
                        Sign up with Google
                    </button>
                </p>
            </div>
        </div>
    )
}
