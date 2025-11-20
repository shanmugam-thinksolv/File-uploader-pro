"use client"

import { useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UploadCloud, CheckCircle, Lock, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormConfig {
    title: string
    description: string
    primaryColor: string
    backgroundColor: string
    fontFamily: string
    allowedTypes: string
    maxSizeMB: number
    isPasswordProtected: boolean
    password?: string
    enableSubmitAnother: boolean
    isAcceptingResponses: boolean
    logoUrl: string
    expiryDate?: string | null
}

export default function UploadForm({ isPreview = false, formId }: { isPreview?: boolean, formId?: string }) {
    const [config, setConfig] = useState<FormConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
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
        if (isPreview) {
            // Mock config for preview
            setConfig({
                title: "Preview Form",
                description: "This is a preview of your form.",
                primaryColor: "#4f46e5",
                backgroundColor: "#ffffff",
                fontFamily: "Inter",
                allowedTypes: "any",
                maxSizeMB: 5,
                isPasswordProtected: false,
                enableSubmitAnother: true,
                isAcceptingResponses: true,
                logoUrl: ""
            })
            setLoading(false)
            setStep('form')
            return
        }

        if (!formId) {
            setError("Form ID is missing")
            setLoading(false)
            return
        }

        fetch(`/api/forms/${formId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error)
                } else {
                    setConfig(data)
                    // If no password, skip auth step
                    if (!data.isPasswordProtected) {
                        setStep('form')
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load config", err)
                setError("Failed to load form configuration")
            })
            .finally(() => setLoading(false))
    }, [formId, isPreview])

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === config?.password) {
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
        accept: config?.allowedTypes && config.allowedTypes !== 'any'
            ? (config?.allowedTypes === 'images' ? { 'image/*': [] } : { 'application/pdf': [], 'application/msword': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] })
            : undefined,
        maxSize: config?.maxSizeMB ? config.maxSizeMB * 1024 * 1024 : undefined
    })

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !formId) return

        setUploading(true)

        try {
            // 1. Upload File
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadRes.ok) throw new Error('File upload failed')

            const uploadData = await uploadRes.json()

            // 2. Submit Form Data
            const submitRes = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formId,
                    fileUrl: uploadData.url,
                    fileName: uploadData.fileName,
                    fileType: uploadData.fileType,
                    fileSize: uploadData.fileSize,
                    submitterName: name,
                    submitterEmail: email,
                    metadata: {}
                })
            })

            if (!submitRes.ok) throw new Error('Submission failed')

            const submitData = await submitRes.json()

            setReferenceId(submitData.id)
            setStep('success')
        } catch (error) {
            console.error("Upload failed", error)
            alert("Upload failed. Please try again.")
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

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[400px] text-red-500">
                <p>{error}</p>
            </div>
        )
    }

    // Check if form is accepting responses
    if (!isPreview && config && !config.isAcceptingResponses) {
        return (
            <div className="w-full max-w-2xl mx-auto p-4">
                <Card className="shadow-lg border-orange-200">
                    <CardHeader className="text-center">
                        <CardTitle className="text-orange-600">Form Closed</CardTitle>
                        <CardDescription>This form is no longer accepting responses.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Check if form has expired
    if (!isPreview && config?.expiryDate) {
        const expiryDate = new Date(config.expiryDate)
        const now = new Date()
        if (expiryDate < now) {
            return (
                <div className="w-full max-w-2xl mx-auto p-4">
                    <Card className="shadow-lg border-red-200">
                        <CardHeader className="text-center">
                            <CardTitle className="text-red-600">Form Expired</CardTitle>
                            <CardDescription>
                                This form expired on {expiryDate.toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )
        }
    }

    // Dynamic Styles
    const containerStyle = {
        fontFamily: config?.fontFamily || 'Inter',
        backgroundColor: config?.backgroundColor || '#ffffff',
        minHeight: '100vh'
    }

    const primaryColor = config?.primaryColor || '#4f46e5'

    return (
        <div style={containerStyle} className="w-full min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                {isPreview && (
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md mb-4 text-center font-medium border border-yellow-200">
                        Preview Mode - No files will be stored
                    </div>
                )}

                {/* Logo Display */}
                {config?.logoUrl && (
                    <div className="flex justify-center mb-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={config.logoUrl}
                            alt="Form logo"
                            className="h-16 md:h-20 object-contain"
                        />
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
                            <CardTitle>{config?.title || "File Upload"}</CardTitle>
                            <CardDescription>
                                {config?.description || "Please fill in your details and upload your file."}
                            </CardDescription>
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
                                                <p className="text-xs">Max size: {config?.maxSizeMB || 5}MB</p>
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
                            {config?.enableSubmitAnother && (
                                <Button variant="outline" onClick={resetForm}>
                                    <RefreshCcw className="w-4 h-4 mr-2" />
                                    Submit Another Response
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    )
}
