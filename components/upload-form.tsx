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
import { Loader2, UploadCloud, CheckCircle, Lock, RefreshCcw, AlertCircle, Trash2, Folder } from "lucide-react"
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
    // Tokens from builder: "any", "images", "docs", or mime types/extensions
    allowedTypes: string[]
    required?: boolean
    allowMultiple?: boolean
    allowFolder?: boolean
}

interface CustomQuestion {
    id: string
    type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
    label: string
    required: boolean
    options?: string[]
}

// Map high-level allowedTypes tokens from the builder into react-dropzone's accept format
const buildAcceptFromAllowedTypes = (allowedTypes?: string[]) => {
    if (!allowedTypes || allowedTypes.length === 0) return undefined
    if (allowedTypes.includes('any')) return undefined

    const accept: Record<string, string[]> = {}

    // Images
    if (allowedTypes.includes('images')) {
        accept['image/*'] = []
    }

    // Document types
    if (allowedTypes.includes('docs')) {
        const docTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ]
        for (const t of docTypes) {
            accept[t] = []
        }
    }

    // Allow passing through raw mime types or extensions stored in allowedTypes
    allowedTypes.forEach(t => {
        if (t === 'any' || t === 'images' || t === 'docs') return
        accept[t] = []
    })

    return Object.keys(accept).length ? accept : undefined
}

const buildAllowedTypesHint = (allowedTypes?: string[]) => {
    if (!allowedTypes || allowedTypes.length === 0 || allowedTypes.includes('any')) {
        return undefined
    }

    const tokens = new Set(allowedTypes)

    const parts: string[] = []
    if (tokens.has('images')) {
        parts.push('images')
        tokens.delete('images')
    }
    if (tokens.has('docs')) {
        parts.push('documents')
        tokens.delete('docs')
    }

    if (tokens.size > 0) {
        parts.push(...Array.from(tokens))
    }

    if (parts.length === 0) return undefined

    const joined =
        parts.length === 1
            ? parts[0]
            : parts.length === 2
                ? `${parts[0]} and ${parts[1]}`
                : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`

    return `You can upload ${joined} only.`
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

// Extended file type with metadata
interface FileWithMetadata extends File {
    _isFromFolder?: boolean
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
    uploading,
    allowedTypesHint,
    allowMultiple = true,
    allowFolder = true,
}: {
    fieldId: string
    label: string
    accept?: any
    files: FileWithMetadata[]
    onDrop: (files: File[], isFromFolder?: boolean) => void
    onRemove: (index: number) => void
    primaryColor: string
    errors?: Record<number, string>
    uploadProgress?: Record<number, number>
    uploading?: boolean
    allowedTypesHint?: string
    allowMultiple?: boolean
    allowFolder?: boolean
}) => {
    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                // Files from dropzone are individual files (not from folder)
                onDrop(allowMultiple ? acceptedFiles : [acceptedFiles[0]], false)
            }
        },
        accept,
        multiple: allowMultiple,
        // No maxSize limit - users can upload any size
        // maxFiles handled via allowMultiple
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
            {allowedTypesHint && (
                <p className="text-xs text-gray-500">
                    {allowedTypesHint}
                </p>
            )}

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
                    {allowMultiple && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>You can upload multiple files</span>
                            {allowFolder && <span>•</span>}
                            {allowFolder && (
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
                                        // Files from folder input are marked as from folder
                                        onDrop(fileList, true)
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
                            )}
                    </div>
                    )}
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
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                            {files.length} {files.length === 1 ? 'file' : 'files'} selected
                        </p>
                    </div>
                    
                    {/* Group files by upload type */}
                    {(() => {
                        const folderFiles: { file: FileWithMetadata; originalIndex: number }[] = []
                        const individualFiles: { file: FileWithMetadata; originalIndex: number }[] = []
                        
                        files.forEach((file, index) => {
                            // Detect if file was uploaded from folder using multiple methods:
                            // Method 1: Check metadata flag (set when explicitly marked)
                            const hasMetadataFlag = (file as FileWithMetadata)._isFromFolder === true
                            
                            // Method 2: Check webkitRelativePath property (browser sets this for folder uploads)
                            // Files from folder input ALWAYS have webkitRelativePath, even if it's just the filename
                            const hasRelativePath = 'webkitRelativePath' in file && 
                                                   (file as any).webkitRelativePath !== undefined && 
                                                   (file as any).webkitRelativePath !== ''
                            
                            // A file is from folder if:
                            // - Explicitly marked with _isFromFolder flag, OR
                            // - Has webkitRelativePath property (indicates folder upload)
                            const isFromFolder = hasMetadataFlag || hasRelativePath
                            
                            if (isFromFolder) {
                                folderFiles.push({ file, originalIndex: index })
                            } else {
                                individualFiles.push({ file, originalIndex: index })
                            }
                        })

                        return (
                            <div className="space-y-4 max-h-64 overflow-y-auto">
                                {/* Uploaded as Folder Section */}
                                {folderFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                            <Folder className="w-4 h-4 text-blue-600" />
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                Uploaded as folder ({folderFiles.length})
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {folderFiles.map(({ file, originalIndex }) => {
                                                const progress = uploadProgress?.[originalIndex]
                                                const isUploading = uploading && progress !== undefined && progress < 100
                                                const isComplete = progress === 100
                                                const hasError = !!errors?.[originalIndex]

                                                return (
                                                    <div
                                                        key={`${file.name}-${originalIndex}`}
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
                                                            {(isUploading || isComplete) && progress !== undefined && (
                                                                <div className="mt-2">
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className={cn(
                                                                                "h-1.5 rounded-full transition-all duration-300",
                                                                                isComplete ? "bg-green-600" : "bg-blue-600"
                                                                            )}
                                                                            style={{ width: `${progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className={cn(
                                                                        "text-xs mt-1",
                                                                        isComplete ? "text-green-600" : "text-blue-600"
                                                                    )}>
                                                                        {progress}% {isComplete ? "uploaded" : "uploading"}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {hasError && (
                                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {errors[originalIndex]}
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
                                                                    onRemove(originalIndex)
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

                                {/* Uploaded as File Section */}
                                {individualFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                            <UploadCloud className="w-4 h-4 text-gray-600" />
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                Uploaded as file ({individualFiles.length})
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {individualFiles.map(({ file, originalIndex }) => {
                                                const progress = uploadProgress?.[originalIndex]
                                                const isUploading = uploading && progress !== undefined && progress < 100
                                                const isComplete = progress === 100
                                                const hasError = !!errors?.[originalIndex]

                                                return (
                                                    <div
                                                        key={`${file.name}-${originalIndex}`}
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
                                                            {(isUploading || isComplete) && progress !== undefined && (
                                                                <div className="mt-2">
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className={cn(
                                                                                "h-1.5 rounded-full transition-all duration-300",
                                                                                isComplete ? "bg-green-600" : "bg-blue-600"
                                                                            )}
                                                                            style={{ width: `${progress}%` }}
                                                                        />
                                                                    </div>
                                                                    <p className={cn(
                                                                        "text-xs mt-1",
                                                                        isComplete ? "text-green-600" : "text-blue-600"
                                                                    )}>
                                                                        {progress}% {isComplete ? "uploaded" : "uploading"}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {hasError && (
                                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    {errors[originalIndex]}
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
                                                                    onRemove(originalIndex)
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
                    })()}
                </div>
            )}

            {/* Required field error when no files have been added */}
            {files.length === 0 && errors && Object.keys(errors).length > 0 && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[0] ?? Object.values(errors)[0]}
                </p>
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
    const [files, setFiles] = useState<Record<string, FileWithMetadata[]>>({})
    const [fileErrors, setFileErrors] = useState<Record<string, Record<number, string>>>({})
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({})
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
                uploadFields: []
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

                    // Ensure uploadFields is an array (but don't add default field)
                    if (!parsedData.uploadFields || !Array.isArray(parsedData.uploadFields)) {
                        parsedData.uploadFields = []
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

    const handleFileDrop = (fieldId: string, newFiles: File[], isFromFolder: boolean = false) => {
        setFiles(prev => {
            const fieldConfig = config?.uploadFields?.find(f => f.id === fieldId) as UploadField | undefined
            const allowMultiple = fieldConfig?.allowMultiple !== false

            const existingFiles = allowMultiple ? (prev[fieldId] || []) : []
            // Add new files, avoiding duplicates by name and size
            const uniqueFiles: FileWithMetadata[] = [...existingFiles]
            newFiles.forEach(newFile => {
                if (!allowMultiple && uniqueFiles.length >= 1) {
                    return
                }
                const isDuplicate = existingFiles.some(
                    f => f.name === newFile.name && f.size === newFile.size
                )
                if (!isDuplicate) {
                    // Mark file with metadata indicating if it came from a folder
                    const fileWithMetadata = newFile as FileWithMetadata
                    
                    // Auto-detect folder uploads: files from folder input have webkitRelativePath property
                    // Check if file has webkitRelativePath (indicates folder upload)
                    // Files from folder input ALWAYS have webkitRelativePath, even if it's just the filename
                    const hasRelativePath = 'webkitRelativePath' in newFile && (newFile as any).webkitRelativePath !== undefined && (newFile as any).webkitRelativePath !== ''
                    
                    // A file is from folder if:
                    // 1. Explicitly marked via isFromFolder parameter, OR
                    // 2. Has webkitRelativePath property (browser sets this for folder uploads)
                    const detectedFromFolder = isFromFolder || hasRelativePath
                    
                    fileWithMetadata._isFromFolder = detectedFromFolder
                    uniqueFiles.push(fileWithMetadata)
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
        // Clear any existing validation error for this question once the user interacts
        setQuestionErrors(prev => {
            if (!prev[questionId]) return prev
            const next = { ...prev }
            delete next[questionId]
            return next
        })
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formId || !config) return

        // Filter to only validate fields with filled labels
        const filledQuestions = config.customQuestions?.filter(q => q.label && q.label.trim() !== '') || []
        const filledUploadFields = config.uploadFields?.filter(field => field.label && field.label.trim() !== '') || []

        // Validate required files
        const missingFiles = filledUploadFields.filter(f => {
            const fieldFiles = files[f.id] || []
            return f.required !== false && fieldFiles.length === 0
        })

        // Validate required custom questions
        const questionErrorMap: Record<string, string> = {}
        for (const q of filledQuestions) {
            if (!q.required) continue
            const value = answers[q.id]

            if (q.type === 'checkbox') {
                const hasSelection = Array.isArray(value)
                    ? value.length > 0
                    : !!value
                if (!hasSelection) {
                    questionErrorMap[q.id] = 'Please select at least one option.'
                }
            } else if (q.type === 'select' || q.type === 'radio' || q.type === 'text' || q.type === 'textarea') {
                if (value === undefined || value === null || value === '') {
                    questionErrorMap[q.id] = 'This field is required.'
                }
            }
        }

        const hasMissingFiles = !!missingFiles && missingFiles.length > 0
        const hasQuestionErrors = Object.keys(questionErrorMap).length > 0

        if (hasMissingFiles || hasQuestionErrors) {
            if (hasMissingFiles) {
                // Set field-specific errors instead of a single global message
                const fieldErrorMap: Record<string, Record<number, string>> = {}
                for (const field of missingFiles!) {
                    fieldErrorMap[field.id] = {
                        0: `Please upload at least one file for "${field.label}".`
                    }
                }
                setFileErrors(fieldErrorMap)
            }

            if (hasQuestionErrors) {
                setQuestionErrors(questionErrorMap)
            }

            // Scroll to the top so the user notices the first errored block
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setError("")
        setUploading(true)
        setFileErrors({})
        setQuestionErrors({})
        setUploadProgress({})

        try {
            const uploadedFiles = []
            const errors: Record<string, Record<number, string>> = {}

            // Upload each file for each field (only fields with filled labels)
            for (const field of filledUploadFields) {
                const fieldFiles = files[field.id] || []

                for (let index = 0; index < fieldFiles.length; index++) {
                    const file = fieldFiles[index]

                    try {
                        // Initialize progress to 0%
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

                        // Use XMLHttpRequest to track upload progress
                        const uploadData = await new Promise<any>((resolve, reject) => {
                            const xhr = new XMLHttpRequest()

                            // Track upload progress with incremental percentages (10%, 20%, 30%...)
                            let lastDisplayedProgress = 0
                            xhr.upload.addEventListener('progress', (e) => {
                                if (e.lengthComputable) {
                                    const percentComplete = Math.round((e.loaded / e.total) * 100)
                                    // Round to nearest 10% increment (0, 10, 20, 30, ..., 100)
                                    const roundedProgress = Math.floor(percentComplete / 10) * 10
                                    // Only update if progress increased (never decrease)
                                    const displayProgress = Math.max(roundedProgress, lastDisplayedProgress)

                                    // Only update state if progress actually increased
                                    if (displayProgress > lastDisplayedProgress) {
                                        lastDisplayedProgress = displayProgress
                                        setUploadProgress(prev => ({
                                            ...prev,
                                            [field.id]: {
                                                ...(prev[field.id] || {}),
                                                [index]: displayProgress
                                            }
                                        }))
                                    }
                                }
                            })

                            // Handle completion
                            xhr.addEventListener('load', () => {
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    try {
                                        const response = JSON.parse(xhr.responseText)
                                        // Ensure progress is 100% on completion
                                        lastDisplayedProgress = 100
                                        setUploadProgress(prev => ({
                                            ...prev,
                                            [field.id]: {
                                                ...(prev[field.id] || {}),
                                                [index]: 100
                                            }
                                        }))
                                        resolve(response)
                                    } catch (parseError) {
                                        reject(new Error('Failed to parse response'))
                                    }
                                } else {
                                    try {
                                        const errorData = JSON.parse(xhr.responseText)
                                        reject(new Error(errorData.details || errorData.error || `Upload failed: ${xhr.statusText}`))
                                    } catch {
                                        reject(new Error(`Upload failed: ${xhr.statusText}`))
                                    }
                                }
                            })

                            // Handle errors
                            xhr.addEventListener('error', () => {
                                reject(new Error('Network error during upload'))
                            })

                            xhr.addEventListener('abort', () => {
                                reject(new Error('Upload was aborted'))
                            })

                            // Start upload
                            xhr.open('POST', '/api/upload')
                            xhr.send(formData)
                        })

                        uploadedFiles.push({
                            ...uploadData,
                            fieldId: field.id,
                            label: field.label,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type
                        })

                    } catch (fileError: any) {
                        // Store error for this specific file
                        if (!errors[field.id]) errors[field.id] = {}
                        errors[field.id][index] = fileError.message || 'Upload failed'

                        // Reset progress on error
                        setUploadProgress(prev => ({
                            ...prev,
                            [field.id]: {
                                ...(prev[field.id] || {}),
                                [index]: 0
                            }
                        }))
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
                    submitterName: null,
                    submitterEmail: null,
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
                                <span className="text-sm font-medium mt-2 block" style={{ color: 'var(--primary-600)' }}>
                                    Contact your administrator to enable the form response.
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
                            {(() => {
                                // Filter to only show fields with filled labels
                                const filledQuestions = config?.customQuestions?.filter(q => q.label && q.label.trim() !== '') || []
                                const filledUploadFields = config?.uploadFields?.filter(field => field.label && field.label.trim() !== '') || []
                                
                                return (filledQuestions.length === 0 && filledUploadFields.length === 0) ? (
                                    <div className="rounded-lg border border-dashed border-primary-200 bg-gray-50 px-4 py-6 text-center space-y-2">
                                        <p className="text-md font-medium text-gray-700">
                                        This upload page isn't ready yet.
                                        </p>
                                        <p className="text-sm text-gray-500">
                                        The person who shared this link hasn't finished setting it up.
                                        You can contact them or check back later.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                            {/* Custom Questions */}
                            {filledQuestions.map((q) => (
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
                                                    className="mt-2"
                                        />
                                    )}

                                    {q.type === 'textarea' && (
                                        <Textarea
                                            required={q.required}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="mt-2"
                                        />
                                    )}

                                    {q.type === 'select' && (
                                        <Select onValueChange={(val) => handleAnswerChange(q.id, val)} required={q.required}>
                                                    <SelectTrigger className="mt-2">
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
                                                <div className="mt-2 space-y-2">
                                        <RadioGroup onValueChange={(val) => handleAnswerChange(q.id, val)} required={q.required}>
                                            {q.options?.map((opt) => (
                                                <div key={opt} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                                                    <Label htmlFor={`${q.id}-${opt}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                                </div>
                                    )}

                                    {q.type === 'checkbox' && (
                                                <div className="mt-2 space-y-3">
                                                    {(q.options && q.options.length > 0 ? q.options : ['Yes']).map((opt) => {
                                                        const current = answers[q.id]
                                                        const selected = Array.isArray(current)
                                                            ? current.includes(opt)
                                                            : !!current && current === opt

                                                        const toggleOption = () => {
                                                            let next: any[] = []
                                                            if (Array.isArray(current)) {
                                                                if (current.includes(opt)) {
                                                                    next = current.filter((v: any) => v !== opt)
                                                                } else {
                                                                    next = [...current, opt]
                                                                }
                                                            } else {
                                                                // start a new array from previous scalar/boolean value if present
                                                                if (current && current !== opt) {
                                                                    next = [current, opt]
                                                                } else if (!current) {
                                                                    next = [opt]
                                                                } else {
                                                                    // current === opt
                                                                    next = []
                                                                }
                                                            }
                                                            handleAnswerChange(q.id, next)
                                                        }

                                                        return (
                                                            <div key={opt} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                                    id={`${q.id}-${opt}`}
                                                className="h-4 w-4 rounded border-gray-300"
                                                style={{ accentColor: 'var(--primary-600)' }}
                                                                    onFocus={(e) => (e.currentTarget.style.outlineColor = 'var(--primary-600)')}
                                                                    checked={selected}
                                                                    onChange={toggleOption}
                                                                />
                                                                <Label htmlFor={`${q.id}-${opt}`} className="font-normal">
                                                                    {opt}
                                                                </Label>
                                                            </div>
                                                        )
                                                    })}

                                                    {('allowOther' in q && (q as any).allowOther) && (() => {
                                                        const opt = 'Other'
                                                        const current = answers[q.id]
                                                        const selected = Array.isArray(current)
                                                            ? current.includes(opt)
                                                            : !!current && current === opt

                                                        const toggleOption = () => {
                                                            let next: any[] = []
                                                            if (Array.isArray(current)) {
                                                                if (current.includes(opt)) {
                                                                    next = current.filter((v: any) => v !== opt)
                                                                } else {
                                                                    next = [...current, opt]
                                                                }
                                                            } else {
                                                                if (current && current !== opt) {
                                                                    next = [current, opt]
                                                                } else if (!current) {
                                                                    next = [opt]
                                                                } else {
                                                                    next = []
                                                                }
                                                            }
                                                            handleAnswerChange(q.id, next)
                                                        }

                                                        const otherKey = `${q.id}__other`
                                                        const otherValue = (answers as any)[otherKey] || ''

                                                        return (
                                                            <div key={`${q.id}-other`} className="flex items-center gap-2 mt-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`${q.id}-other`}
                                                                    className="h-4 w-4 rounded border-gray-300"
                                                                    style={{ accentColor: 'var(--primary-600)' }}
                                                                    onFocus={(e) => (e.currentTarget.style.outlineColor = 'var(--primary-600)')}
                                                                    checked={selected}
                                                                    onChange={toggleOption}
                                                                />
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <span className="text-sm text-gray-600 font-normal">Other:</span>
                                                                    <Input
                                                                        value={otherValue}
                                                                        onChange={(e) => handleAnswerChange(otherKey, e.target.value)}
                                                                        disabled={!selected}
                                                                        className={`h-8 flex-1 border-b border-dashed border-gray-300 border-x-0 border-t-0 rounded-none px-0 py-0 text-sm bg-transparent focus-visible:ring-0 ${selected ? 'focus-visible:border-primary-500' : 'text-gray-400 cursor-not-allowed'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    })()}
                                        </div>
                                    )}

                                            {questionErrors[q.id] && (
                                                <p className="text-sm text-red-500 mt-1">
                                                    {questionErrors[q.id]}
                                                </p>
                                            )}
                                </div>
                            ))}

                            {/* Upload Fields */}
                            <div className="space-y-4">
                                {filledUploadFields.map((field) => (
                                    <FileDropzone
                                        key={field.id}
                                        fieldId={field.id}
                                        label={field.label}
                                                accept={buildAcceptFromAllowedTypes(field.allowedTypes)}
                                                allowedTypesHint={buildAllowedTypesHint(field.allowedTypes)}
                                                allowMultiple={field.allowMultiple !== false}
                                                allowFolder={field.allowFolder !== false}
                                        files={files[field.id] || []}
                                        onDrop={(newFiles, isFromFolder) => handleFileDrop(field.id, newFiles, isFromFolder)}
                                        onRemove={(index) => handleFileRemove(field.id, index)}
                                        primaryColor={primaryColor}
                                        errors={fileErrors[field.id]}
                                        uploadProgress={uploadProgress[field.id]}
                                        uploading={uploading}
                                    />
                                ))}
                            </div>
                                </>
                                )
                            })()}

                        </CardContent>
                        {(() => {
                            // Filter to only show fields with filled labels
                            const filledQuestions = config?.customQuestions?.filter(q => q.label && q.label.trim() !== '') || []
                            const filledUploadFields = config?.uploadFields?.filter(field => field.label && field.label.trim() !== '') || []
                            
                            return (filledQuestions.length > 0 || filledUploadFields.length > 0) && (
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={uploading} style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
                                {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Submit Upload"}
                            </Button>
                        </CardFooter>
                            )
                        })()}
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
                        <p className="text-sm text-muted-foreground">
                            Your upload has been recorded. You can save this reference ID for your records.
                        </p>
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