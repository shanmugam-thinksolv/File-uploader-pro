"use client"

import { useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UploadCloud, CheckCircle, Lock, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export default function UploadForm({ isPreview = false }: { isPreview?: boolean }) {
    const [config, setConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState<'auth' | 'form' | 'success'>('auth')

    // Auth State
    const [password, setPassword] = useState("")
    const [authError, setAuthError] = useState("")

    // Form State
    const [file, setFile] = useState<File | null>(null)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [uploading, setUploading] = useState(false)

    // Success State
    const [referenceId, setReferenceId] = useState("")

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data)
                // If no password, skip auth step
                if (!data.isPasswordProtected) {
                    setStep('form')
                }
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to load config", err)
                setLoading(false)
            })
    }, [])

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === config.password) {
            setStep('form')
            setAuthError("")
        } else {
            setAuthError("Incorrect password")
        }
    }

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: config?.allowedTypes ? config.allowedTypes.reduce((acc: any, curr: string) => ({ ...acc, [curr]: [] }), {}) : undefined
    })

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setUploading(true)

        try {
            // Simulate upload
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: JSON.stringify({ name, email, fileName: file.name }) // In real app, use FormData
            })
            const data = await res.json()

            if (data.success) {
                setReferenceId(data.referenceId)
                setStep('success')
            }
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setFile(null)
        setName("")
        setEmail("")
        setStep('form')
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    // Dynamic Styles
    const containerStyle = {
        fontFamily: config?.design?.fontFamily || 'Inter',
    }

    const primaryColor = config?.design?.primaryColor || '#000000'

    return (
        <div style={containerStyle} className="w-full max-w-2xl mx-auto p-4">
            {isPreview && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md mb-4 text-center font-medium border border-yellow-200">
                    Preview Mode - No files will be stored
                </div>
            )}

            {/* Auth Step */}
            {step === 'auth' && (
                <Card className="shadow-lg">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                            <Lock className="w-6 h-6" style={{ color: primaryColor }} />
                        </div>
                        <CardTitle>Protected Form</CardTitle>
                        <CardDescription>Please enter the password to continue.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAuth}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={authError ? "border-red-500" : ""}
                                />
                                {authError && <p className="text-sm text-red-500">{authError}</p>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" style={{ backgroundColor: primaryColor }}>
                                Access Form
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {/* Form Step */}
            {step === 'form' && (
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>File Upload</CardTitle>
                        <CardDescription>Please fill in your details and upload your file.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUpload}>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Upload File</Label>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:bg-muted/50",
                                        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                                        file ? "bg-green-50 border-green-200" : ""
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    {file ? (
                                        <div className="flex flex-col items-center gap-2 text-green-700">
                                            <CheckCircle className="w-8 h-8" />
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <UploadCloud className="w-8 h-8" />
                                            <p className="font-medium">Drag & drop or click to select</p>
                                            <p className="text-xs">Max size: {config.maxSizeMB}MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                type="submit"
                                disabled={!file || uploading}
                                style={{ backgroundColor: primaryColor }}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Submit Upload"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {/* Success Step */}
            {step === 'success' && (
                <Card className="shadow-lg text-center">
                    <CardHeader>
                        <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Upload Successful!</CardTitle>
                        <CardDescription>Your file has been securely uploaded.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm text-muted-foreground mb-1">Reference ID</p>
                            <div className="flex items-center justify-center gap-2">
                                <code className="text-xl font-mono font-bold">{referenceId}</code>
                                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(referenceId)}>
                                    Copy
                                </Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            A confirmation email has been sent to {email}.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        {config.enableSubmitAnother && (
                            <Button variant="outline" onClick={resetForm}>
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Submit Another Response
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
