"use client"

import { useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UploadCloud, CheckCircle, Lock, RefreshCcw, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface UploadField {
    id: string
    label: string
    allowedTypes: string[]
    maxSize: number
    required?: boolean
}

interface CustomQuestion {
    id: string
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
    label: string
    required: boolean
    options?: string[]
}

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
    uploadFields?: UploadField[]
    customQuestions?: CustomQuestion[]
    buttonTextColor?: string
    cardStyle?: string
    borderRadius?: string
}

// Helper Component for Single File Dropzone
const FileDropzone = ({
    fieldId,
    label,
    accept,
    maxSize,
    file,
    onDrop,
    onRemove,
    primaryColor
}: {
    fieldId: string
    label: string
    accept?: any
    maxSize?: number
    file: File | null
    onDrop: (file: File) => void
    onRemove: () => void
    primaryColor: string
}) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) onDrop(acceptedFiles[0])
        },
        maxFiles: 1,
        accept,
        maxSize
    })

    return (
        <div className="space-y-2">
            <Label className="text-base font-medium">{label}</Label>
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-muted/50 relative",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    file ? "bg-green-50 border-green-200" : ""
                )}
                style={isDragActive ? { borderColor: primaryColor } : {}}
            >
                <input {...getInputProps()} />
                {file ? (
                    <div className="flex flex-col items-center gap-2 text-green-700">
                        <CheckCircle className="w-8 h-8" />
                        <p className="font-medium truncate max-w-full px-4">{file.name}</p>
                        <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove()
                            }}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="w-8 h-8" />
                        <p className="font-medium">Drag & drop or click to select</p>
                        <p className="text-xs text-gray-400">
                            Max size: {maxSize ? (maxSize / 1024 / 1024).toFixed(0) : 5}MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function UploadForm({ isPreview = false, formId, initialData }: { isPreview?: boolean, formId?: string, initialData?: FormConfig }) {
    const [config, setConfig] = useState<FormConfig | null>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [error, setError] = useState("")
    const [step, setStep] = useState<'auth' | 'form' | 'success'>('auth')

    // Auth State
    const [password, setPassword] = useState("")
    const [authError, setAuthError] = useState("")

    // Form State
    const [files, setFiles] = useState<Record<string, File | null>>({})
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [uploading, setUploading] = useState(false)

    // Success State
    const [referenceId, setReferenceId] = useState("")

    useEffect(() => {
        if (initialData) {
            if (!initialData.isPasswordProtected) {
                setStep('form')
            }
            return
        }

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
                logoUrl: "",
                uploadFields: [
                    { id: "default", label: "Upload File", allowedTypes: [], maxSize: 5 * 1024 * 1024 }
                ]
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
                    // Parse JSON fields if they are strings (Prisma might return them as objects already, but safe to check)
                    const parsedData = { ...data }
                    if (typeof parsedData.uploadFields === 'string') {
                        try { parsedData.uploadFields = JSON.parse(parsedData.uploadFields) } catch (e) { }
                    }
                    if (typeof parsedData.customQuestions === 'string') {
                        try { parsedData.customQuestions = JSON.parse(parsedData.customQuestions) } catch (e) { }
                    }

                    // Ensure uploadFields has at least one field if empty
                    if (!parsedData.uploadFields || parsedData.uploadFields.length === 0) {
                        parsedData.uploadFields = [{
                            id: "default",
                            label: "Upload File",
                            allowedTypes: parsedData.allowedTypes ? parsedData.allowedTypes.split(',') : [],
                            maxSize: parsedData.maxSizeMB * 1024 * 1024
                        }]
                    }

                    setConfig(parsedData)
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
    }, [formId, isPreview, initialData])

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === config?.password) {
            setStep('form')
            setAuthError("")
        } else {
            setAuthError("Incorrect password")
        }
    }

    const handleFileDrop = (fieldId: string, file: File) => {
        setFiles(prev => ({ ...prev, [fieldId]: file }))
    }

    const handleFileRemove = (fieldId: string) => {
        setFiles(prev => {
            const next = { ...prev }
            delete next[fieldId]
            return next
        })
    }

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formId || !config) return

        // Validate required files
        const missingFiles = config.uploadFields?.filter(f => f.required !== false && !files[f.id])

        if (missingFiles && missingFiles.length > 0) {
            setError(`Please upload the following required files: ${missingFiles.map(f => f.label).join(", ")}`)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setError("")
        setUploading(true)

        try {
            const uploadedFiles = []

            // Upload each file
            for (const field of config.uploadFields || []) {
                const file = files[field.id]
                if (file) {
                    const formData = new FormData()
                    formData.append('file', file)

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    })

                    if (!uploadRes.ok) throw new Error(`Upload failed for ${field.label}`)
                    const uploadData = await uploadRes.json()

                    uploadedFiles.push({
                        ...uploadData,
                        fieldId: field.id,
                        label: field.label
                    })
                }
            }

            // Submit Form Data
            const submitRes = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formId,
                    files: uploadedFiles,
                    answers: Object.entries(answers).map(([qId, ans]) => ({ questionId: qId, answer: ans })),
                    submitterName: answers['name'] || 'Anonymous',
                    submitterEmail: answers['email'] || '',
                    metadata: answers
                })
            })

            if (!submitRes.ok) {
                const errorText = await submitRes.text()
                console.error("Submission failed response:", errorText)
                throw new Error('Submission failed: ' + errorText)
            }
            const submitData = await submitRes.json()

            setReferenceId(submitData.id)
            setStep('success')
        } catch (error) {
            console.error("Upload failed", error)
            setError("Upload failed. Please try again.")
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setFiles({})
        setAnswers({})
        setStep('form')
    }

    if (loading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    if (error) return <div className="flex justify-center items-center min-h-[400px] text-red-500"><p>{error}</p></div>

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

    const primaryColor = config?.primaryColor || '#4f46e5'
    const buttonTextColor = config?.buttonTextColor || '#ffffff'
    const borderRadius = config?.borderRadius || 'md'
    const cardStyle = config?.cardStyle || 'shadow'

    // Border radius mapping
    const borderRadiusClasses = {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-3xl'
    }

    // Card style classes
    const cardStyleClasses = {
        shadow: 'shadow-lg',
        flat: 'shadow-none',
        border: 'shadow-none border-2 border-gray-200'
    }

    const cardClasses = cn(
        cardStyleClasses[cardStyle as keyof typeof cardStyleClasses] || cardStyleClasses.shadow,
        borderRadiusClasses[borderRadius as keyof typeof borderRadiusClasses] || borderRadiusClasses.md
    )

    return (
        <div className="w-full max-w-2xl mx-auto">
            {isPreview && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md mb-4 text-center font-medium border border-yellow-200">
                    Preview Mode - No files will be stored
                </div>
            )}

            {config?.logoUrl && (
                <div className="flex justify-center mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.logoUrl} alt="Form logo" className="h-16 md:h-20 object-contain" />
                </div>
            )}

            {step === 'auth' && (
                <Card className={cardClasses}>
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
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={authError ? "border-red-500" : ""} />
                                {authError && <p className="text-sm text-red-500">{authError}</p>}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" style={{ backgroundColor: primaryColor, color: buttonTextColor }}>Access Form</Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {step === 'form' && (
                <Card className={cardClasses}>
                    <CardHeader>
                        <CardTitle>{config?.title || "File Upload"}</CardTitle>
                        <CardDescription>{config?.description || "Please fill in your details and upload your file."}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUpload}>
                        <CardContent className="space-y-6">
                            {/* Standard Fields (Name/Email) - Only if not in custom questions? 
                                Let's keep them as standard for now, but maybe map them to answers['name'] etc. 
                            */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={answers['name'] || ''}
                                        onChange={(e) => handleAnswerChange('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        value={answers['email'] || ''}
                                        onChange={(e) => handleAnswerChange('email', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Custom Questions */}
                            {config?.customQuestions?.map((q) => (
                                <div key={q.id} className="space-y-2">
                                    <Label>
                                        {q.label}
                                        {q.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>

                                    {q.type === 'text' && (
                                        <Input
                                            required={q.required}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        />
                                    )}

                                    {q.type === 'textarea' && (
                                        <Textarea
                                            required={q.required}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        />
                                    )}

                                    {q.type === 'select' && (
                                        <Select onValueChange={(val) => handleAnswerChange(q.id, val)} required={q.required}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {q.options?.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {q.type === 'radio' && (
                                        <RadioGroup onValueChange={(val) => handleAnswerChange(q.id, val)} required={q.required}>
                                            {q.options?.map((opt) => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                                                    <Label htmlFor={`${q.id}-${opt}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}

                                    {q.type === 'checkbox' && (
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={q.id}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={!!answers[q.id]}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.checked)}
                                                required={q.required}
                                            />
                                            <Label htmlFor={q.id} className="font-normal">Yes</Label>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Upload Fields */}
                            <div className="space-y-4">
                                {config?.uploadFields?.map((field) => (
                                    <FileDropzone
                                        key={field.id}
                                        fieldId={field.id}
                                        label={field.label}
                                        accept={field.allowedTypes?.length ? Object.fromEntries(field.allowedTypes.map(t => [t, []])) : undefined}
                                        maxSize={field.maxSize}
                                        file={files[field.id] || null}
                                        onDrop={(f) => handleFileDrop(field.id, f)}
                                        onRemove={() => handleFileRemove(field.id)}
                                        primaryColor={primaryColor}
                                    />
                                ))}
                            </div>

                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={uploading} style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
                                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Submit Upload"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {step === 'success' && (
                <Card className={cn(cardClasses, "text-center")}>
                    <CardHeader>
                        <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl text-green-700">Upload Successful!</CardTitle>
                        <CardDescription>Your files have been securely uploaded.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm text-muted-foreground mb-1">Reference ID</p>
                            <div className="flex items-center justify-center gap-2">
                                <code className="text-xl font-mono font-bold">{referenceId}</code>
                                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(referenceId)}>Copy</Button>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">A confirmation email has been sent to {answers['email']}.</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        {config?.enableSubmitAnother && (
                            <Button variant="outline" onClick={resetForm}>
                                <RefreshCcw className="w-4 h-4 mr-2" /> Submit Another Response
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    )
}
