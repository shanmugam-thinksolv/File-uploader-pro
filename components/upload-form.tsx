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
import { Loader2, UploadCloud, CheckCircle, Lock, RefreshCcw, AlertCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkExcel, BsImage, BsFileEarmarkPlay, BsFileEarmarkMusic, BsFileEarmarkZip, BsFileEarmarkText } from "react-icons/bs"

// @ts-ignore
declare module 'react' {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        webkitdirectory?: string | boolean;
        mozdirectory?: string | boolean;
        directory?: string | boolean;
    }
}

// Types
interface UploadField {
    id: string
    label: string
    allowedTypes: string[]
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

// Helper Component for Multiple File Dropzone
const FileDropzone = ({
    fieldId,
    label,
    accept,
    files,
    onDrop,
    onRemove,
    primaryColor,
    errors,
    uploadProgress,
    uploading
}: {
    fieldId: string
    label: string
    accept?: any
    files: File[]
    onDrop: (files: File[]) => void
    onRemove: (index: number) => void
    primaryColor: string
    errors?: Record<number, string>
    uploadProgress?: Record<number, number>
    uploading?: boolean
}) => {
    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onDrop(acceptedFiles)
            }
        },
        accept
        // No maxSize limit - users can upload any size
        // No maxFiles limit - users can upload multiple files
    })

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileIcon = (file: File) => {
        const type = file.type
        const style = { color: 'rgb(79, 70, 229)' }
        const className = "w-8 h-8"

        if (type.includes('image')) return <BsImage style={style} className={className} />
        if (type.includes('video')) return <BsFileEarmarkPlay style={style} className={className} />
        if (type.includes('audio')) return <BsFileEarmarkMusic style={style} className={className} />
        if (type.includes('pdf')) return <BsFileEarmarkPdf style={style} className={className} />
        if (type.includes('word') || type.includes('document')) return <BsFileEarmarkWord style={style} className={className} />
        if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return <BsFileEarmarkExcel style={style} className={className} />
        if (type.includes('zip') || type.includes('compressed')) return <BsFileEarmarkZip style={style} className={className} />

        return <BsFileEarmarkText style={style} className={className} />
    }

    return (
        <div className="space-y-3">
            <Label className="text-base font-medium">{label}</Label>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:bg-muted/50",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                style={isDragActive ? { borderColor: primaryColor } : {}}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="w-8 h-8" />
                    <p className="font-medium">Drag & drop files or click to select</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>You can upload multiple files</span>
                        <span>•</span>
                        <div className="relative">
                            <input
                                type="file"
                                webkitdirectory=""
                                mozdirectory=""
                                directory=""
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const fileList = Array.from(e.target.files)
                                        // Filter out system files if needed, but for now take all
                                        onDrop(fileList)
                                        // Reset value so same folder can be selected again if needed
                                        e.target.value = ''
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()} // Prevent dropzone click
                            />
                            <span className="text-primary hover:underline cursor-pointer">
                                Upload a folder
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* File Rejection Errors */}
            {fileRejections.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800">Some files were rejected:</p>
                            <ul className="mt-1 text-xs text-red-700 list-disc list-inside">
                                {fileRejections.map(({ file, errors }, idx) => (
                                    <li key={idx}>
                                        {file.name}: {errors.map(e => e.message).join(', ')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                            {files.length} {files.length === 1 ? 'file' : 'files'} selected
                        </p>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file, index) => {
                            const progress = uploadProgress?.[index]
                            const isUploading = uploading && progress !== undefined && progress < 100
                            const isComplete = progress === 100
                            const hasError = !!errors?.[index]

                            return (
                                <div
                                    key={`${file.name}-${index}`}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                        hasError
                                            ? "bg-red-50 border-red-200"
                                            : isComplete
                                                ? "bg-green-50 border-green-200"
                                                : isUploading
                                                    ? "bg-blue-50 border-blue-200"
                                                    : "bg-gray-50 border-gray-200"
                                    )}
                                >
                                    <div className="flex-shrink-0">{getFileIcon(file)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                hasError ? "text-red-800" : isComplete ? "text-green-800" : "text-gray-800"
                                            )}>
                                                {file.name}
                                            </p>
                                            {isUploading && (
                                                <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
                                            )}
                                            {isComplete && !hasError && (
                                                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-xs mt-0.5",
                                            hasError ? "text-red-600" : isComplete ? "text-green-600" : "text-gray-600"
                                        )}>
                                            {formatFileSize(file.size)}
                                        </p>
                                        {isUploading && progress !== undefined && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-blue-600 mt-1">{progress}% uploaded</p>
                                            </div>
                                        )}
                                        {hasError && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors[index]}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-8 p-0 flex-shrink-0",
                                            hasError
                                                ? "text-red-600 hover:text-red-800 hover:bg-red-100"
                                                : isComplete
                                                    ? "text-green-600 hover:text-green-800 hover:bg-green-100"
                                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (!isUploading) {
                                                onRemove(index)
                                            }
                                        }}
                                        disabled={isUploading}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
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
    const [files, setFiles] = useState<Record<string, File[]>>({})
    const [fileErrors, setFileErrors] = useState<Record<string, Record<number, string>>>({})
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<Record<string, Record<number, number>>>({})

    // Success State
    const [referenceId, setReferenceId] = useState("")

    useEffect(() => {
        if (initialData) {
            // Check if form has expired
            if (initialData.expiryDate) {
                const expiryDate = new Date(initialData.expiryDate)
                const now = new Date()
                if (now > expiryDate) {
                    setError(`This form expired on ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()}. It is no longer accepting submissions.`)
                    setLoading(false)
                    return
                }
            }

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
                isPasswordProtected: false,
                enableSubmitAnother: true,
                isAcceptingResponses: true,
                logoUrl: "",
                uploadFields: [
                    { id: "default", label: "Upload File", allowedTypes: [] }
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
                            allowedTypes: parsedData.allowedTypes ? parsedData.allowedTypes.split(',') : []
                        }]
                    }

                    // Check if form has expired
                    if (parsedData.expiryDate) {
                        const expiryDate = new Date(parsedData.expiryDate)
                        const now = new Date()
                        if (now > expiryDate) {
                            setError(`This form expired on ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()}. It is no longer accepting submissions.`)
                            setLoading(false)
                            return
                        }
                    }

                    setConfig(parsedData)
                    if (!data.isPasswordProtected) {
                        setStep('form')
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load config", err)
                const errorData = err instanceof Error ? err.message : 'Failed to load form configuration'
                if (errorData.includes('expired') || errorData.includes('410')) {
                    setError('This form has expired and is no longer accepting submissions.')
                } else {
                    setError("Failed to load form configuration")
                }
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

    const handleFileDrop = (fieldId: string, newFiles: File[]) => {
        setFiles(prev => {
            const existingFiles = prev[fieldId] || []
            // Add new files, avoiding duplicates by name and size
            const uniqueFiles = [...existingFiles]
            newFiles.forEach(newFile => {
                const isDuplicate = existingFiles.some(
                    f => f.name === newFile.name && f.size === newFile.size
                )
                if (!isDuplicate) {
                    uniqueFiles.push(newFile)
                }
            })
            return { ...prev, [fieldId]: uniqueFiles }
        })
        // Clear errors for this field when new files are added
        setFileErrors(prev => {
            const next = { ...prev }
            delete next[fieldId]
            return next
        })
    }

    const handleFileRemove = (fieldId: string, index: number) => {
        setFiles(prev => {
            const fieldFiles = prev[fieldId] || []
            const updatedFiles = fieldFiles.filter((_, i) => i !== index)
            if (updatedFiles.length === 0) {
                const next = { ...prev }
                delete next[fieldId]
                return next
            }
            return { ...prev, [fieldId]: updatedFiles }
        })
        // Remove error for this file
        setFileErrors(prev => {
            const fieldErrors = prev[fieldId] || {}
            const updatedErrors = { ...fieldErrors }
            delete updatedErrors[index]
            // Reindex remaining errors
            const reindexed: Record<number, string> = {}
            Object.keys(updatedErrors).forEach((key, newIdx) => {
                const oldIdx = parseInt(key)
                if (oldIdx > index) {
                    reindexed[oldIdx - 1] = updatedErrors[oldIdx]
                } else if (oldIdx < index) {
                    reindexed[oldIdx] = updatedErrors[oldIdx]
                }
            })
            if (Object.keys(reindexed).length === 0) {
                const next = { ...prev }
                delete next[fieldId]
                return next
            }
            return { ...prev, [fieldId]: reindexed }
        })
        // Remove upload progress for this file
        setUploadProgress(prev => {
            const fieldProgress = prev[fieldId] || {}
            const updatedProgress = { ...fieldProgress }
            delete updatedProgress[index]
            if (Object.keys(updatedProgress).length === 0) {
                const next = { ...prev }
                delete next[fieldId]
                return next
            }
            return { ...prev, [fieldId]: updatedProgress }
        })
    }

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formId || !config) return

        // Validate required files
        const missingFiles = config.uploadFields?.filter(f => {
            const fieldFiles = files[f.id] || []
            return f.required !== false && fieldFiles.length === 0
        })

        if (missingFiles && missingFiles.length > 0) {
            setError(`Please upload at least one file for: ${missingFiles.map(f => f.label).join(", ")}`)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setError("")
        setUploading(true)
        setFileErrors({})
        setUploadProgress({})

        try {
            const uploadedFiles = []
            const errors: Record<string, Record<number, string>> = {}

            // Upload each file for each field
            for (const field of config.uploadFields || []) {
                const fieldFiles = files[field.id] || []

                for (let index = 0; index < fieldFiles.length; index++) {
                    const file = fieldFiles[index]

                    try {
                        // Update progress
                        setUploadProgress(prev => ({
                            ...prev,
                            [field.id]: {
                                ...(prev[field.id] || {}),
                                [index]: 0
                            }
                        }))

                        const formData = new FormData()
                        formData.append('file', file)
                        if (formId) formData.append('formId', formId)

                        const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData
                        })

                        if (!uploadRes.ok) {
                            const errorData = await uploadRes.json()
                            const errorMsg = errorData.details || errorData.error || `Upload failed for ${file.name}`

                            // Store error for this specific file
                            if (!errors[field.id]) errors[field.id] = {}
                            errors[field.id][index] = errorMsg

                            // Continue with other files instead of throwing
                            continue
                        }

                        const uploadData = await uploadRes.json()

                        uploadedFiles.push({
                            ...uploadData,
                            fieldId: field.id,
                            label: field.label,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type
                        })

                        // Update progress to 100%
                        setUploadProgress(prev => ({
                            ...prev,
                            [field.id]: {
                                ...(prev[field.id] || {}),
                                [index]: 100
                            }
                        }))
                    } catch (fileError: any) {
                        // Store error for this specific file
                        if (!errors[field.id]) errors[field.id] = {}
                        errors[field.id][index] = fileError.message || 'Upload failed'
                    }
                }
            }

            // If there are errors, show them but don't fail completely
            if (Object.keys(errors).length > 0) {
                setFileErrors(errors)
                const errorCount = Object.values(errors).reduce((sum, fieldErrors) => sum + Object.keys(fieldErrors).length, 0)
                if (uploadedFiles.length === 0) {
                    // All files failed
                    setError(`${errorCount} file(s) failed to upload. Please check the errors below and try again.`)
                    setUploading(false)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    return
                } else {
                    // Some files succeeded
                    setError(`Warning: ${errorCount} file(s) failed to upload, but ${uploadedFiles.length} file(s) were uploaded successfully.`)
                }
            }

            // Check if we have any files to submit
            if (uploadedFiles.length === 0) {
                setError('No files were uploaded successfully. Please try again.')
                setUploading(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                return
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
        setFileErrors({})
        setUploadProgress({})
        setAnswers({})
        setStep('form')
        setError("")
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

    // Check if form has expired (client-side check)
    if (!isPreview && config && config.expiryDate) {
        const expiryDate = new Date(config.expiryDate)
        const now = new Date()
        if (now > expiryDate) {
            return (
                <div className="w-full max-w-2xl mx-auto p-4">
                    <Card className="shadow-lg border-orange-200">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <CardTitle className="text-orange-600">Form Expired</CardTitle>
                            <CardDescription>
                                This form is no longer accepting submissions.
                                <br />
                                <span className="text-sm text-gray-500 mt-2 block">
                                    Expired on {expiryDate.toLocaleDateString()} at {expiryDate.toLocaleTimeString()}
                                </span>
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )
        }
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
                                        files={files[field.id] || []}
                                        onDrop={(newFiles) => handleFileDrop(field.id, newFiles)}
                                        onRemove={(index) => handleFileRemove(field.id, index)}
                                        primaryColor={primaryColor}
                                        errors={fileErrors[field.id]}
                                        uploadProgress={uploadProgress[field.id]}
                                        uploading={uploading}
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