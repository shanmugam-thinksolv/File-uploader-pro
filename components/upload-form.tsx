"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UploadCloud, CheckCircle, Lock, RefreshCcw, AlertCircle, Trash2, Folder, X } from "lucide-react"
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
    accessProtectionType?: "PUBLIC" | "PASSWORD" | "GOOGLE"
    allowedDomains?: string
}

// Extended file type with metadata
interface FileWithMetadata extends File {
    _isFromFolder?: boolean
    _folderName?: string // Name of the folder this file belongs to (if from folder upload)
}

// Folder group for UI display
interface FolderGroup {
    folderName: string
    files: FileWithMetadata[]
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
    onViewFolder,
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
    onViewFolder?: (fieldId: string, folderName: string) => void
}) => {
    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                // Files from dropzone are individual files (not from folder)
                // Always pass false for isFromFolder since dropzone is for individual files
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
                        // Group folder files by folder name
                        const folderGroups: Record<string, FolderGroup> = {}
                        const individualFiles: { file: FileWithMetadata; originalIndex: number }[] = []
                        
                        files.forEach((file, index) => {
                            // Use _isFromFolder as single source of truth
                            // This flag is set during file ingestion (handleFileDrop)
                            const isFromFolder = (file as FileWithMetadata)._isFromFolder === true
                            
                            if (isFromFolder) {
                                const folderName = file._folderName || 'Unknown Folder'
                                if (!folderGroups[folderName]) {
                                    folderGroups[folderName] = {
                                        folderName,
                                        files: []
                                    }
                                }
                                folderGroups[folderName].files.push(file)
                            } else {
                                individualFiles.push({ file, originalIndex: index })
                            }
                        })
                        
                        const folders = Object.values(folderGroups)

                        return (
                            <div className="space-y-4 max-h-64 overflow-y-auto">
                                {/* Uploaded as Folder Section - Show ONE item per folder */}
                                {folders.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                            <Folder className="w-4 h-4 text-blue-600" />
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                Folders ({folders.length})
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {/* Show ONE item per folder */}
                                            {folders.map((folder) => {
                                                const totalSize = folder.files.reduce((acc, f) => acc + f.size, 0)
                                                
                                                return (
                                                    <div
                                                        key={folder.folderName}
                                                        className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            // Open folder viewer popup
                                                            onViewFolder?.(fieldId, folder.folderName)
                                                        }}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            <Folder className="w-8 h-8 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-blue-900 truncate">
                                                                {folder.folderName}
                                                            </p>
                                                            <p className="text-xs text-blue-700 mt-0.5">
                                                                {folder.files.length} {folder.files.length === 1 ? 'file' : 'files'} • {formatFileSize(totalSize)}
                                                            </p>
                                                        </div>
                                                        <div className="text-xs text-blue-600 flex-shrink-0">
                                                            Click to view
                                                        </div>
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
                    {/* Show the first error message (field-level, not index-level) */}
                    {Object.values(errors)[0]}
                </p>
            )}
        </div>
    )
}

export default function UploadForm({ isPreview = false, formId, initialData, formOwnerId }: { isPreview?: boolean, formId?: string, initialData?: FormConfig, formOwnerId?: string }) {
    const { data: session } = useSession()
    const [config, setConfig] = useState<FormConfig | null>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [error, setError] = useState("")
    const [step, setStep] = useState<'auth' | 'google_auth' | 'form' | 'success'>(
        initialData 
            ? (initialData.accessProtectionType === 'GOOGLE' ? 'google_auth' : 
               initialData.accessProtectionType === 'PASSWORD' ? 'auth' : 'form')
            : 'auth'
    )
    const [isDomainBlocked, setIsDomainBlocked] = useState(false)
    
    // Check if current user is the form owner/admin
    const isFormOwner = isPreview || (session?.user?.id && formOwnerId && session.user.id === formOwnerId)

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
    
    // Folder viewer state
    const [viewingFolder, setViewingFolder] = useState<{ fieldId: string; folderName: string } | null>(null)

    // Success State
    const [referenceId, setReferenceId] = useState("")

    // Check Google Auth Restriction
    useEffect(() => {
        if (!config || isPreview) return

        if (config.accessProtectionType === 'GOOGLE') {
            if (!session) {
                setStep('google_auth')
            } else {
                // Check domains if restricted
                const domains = config.allowedDomains 
                    ? config.allowedDomains.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
                    : []
                
                if (domains.length > 0) {
                    const userEmail = session.user?.email || ""
                    const userDomain = userEmail.split('@')[1]?.toLowerCase()
                    
                    if (!userDomain || !domains.includes(userDomain)) {
                        setIsDomainBlocked(true)
                        setError("Access Denied: Your email domain is not authorized to access this form.")
                        return
                    }
                }
                setStep('form')
            }
        } else if (config.accessProtectionType === 'PASSWORD') {
            setStep('auth')
        } else {
            setStep('form')
        }
    }, [config, session, isPreview])

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
                uploadFields: [],
                accessProtectionType: "PUBLIC"
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
            // Add new files (duplicates are now allowed)
            const updatedFiles: FileWithMetadata[] = [...existingFiles]
            newFiles.forEach(newFile => {
                if (!allowMultiple && updatedFiles.length >= 1) {
                    return
                }
                
                // Mark file with metadata indicating if it came from a folder
                const fileWithMetadata = newFile as FileWithMetadata
                
                // Set _isFromFolder based ONLY on the isFromFolder parameter passed from FileDropzone
                // This is the single source of truth for folder detection
                fileWithMetadata._isFromFolder = isFromFolder
                
                // If from folder, extract folder name from webkitRelativePath (first part of path)
                if (isFromFolder && 'webkitRelativePath' in newFile) {
                    const relativePath = (newFile as any).webkitRelativePath as string
                    if (relativePath) {
                        const pathParts = relativePath.split('/')
                        fileWithMetadata._folderName = pathParts[0] || 'Unknown Folder'
                    }
                }
                
                updatedFiles.push(fileWithMetadata)
            })
            return { ...prev, [fieldId]: updatedFiles }
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

        // Generate a unique submission ID for this upload session
        // This will be used to create a per-submission folder in Google Drive
        const submissionId = crypto.randomUUID()

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
                // Set field-level errors (not index-based)
                // Use a special key 'field' to indicate field-level error
                const fieldErrorMap: Record<string, Record<string, string>> = {}
                for (const field of missingFiles!) {
                    fieldErrorMap[field.id] = {
                        'field': `Please upload at least one file for "${field.label}".`
                    }
                }
                setFileErrors(fieldErrorMap as any)
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
                        formData.append('fieldId', field.id) // Send fieldId so API can echo it back
                        formData.append('submissionId', submissionId) // Send submission ID for per-submission folder
                        
                        // Send folder name if this file is from a folder upload
                        const fileMetadata = file as FileWithMetadata
                        if (fileMetadata._folderName) {
                            formData.append('folderName', fileMetadata._folderName)
                        }

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

                        // Extract folder metadata
                        const fileWithMetadata = file as FileWithMetadata
                        const isFromFolder = fileWithMetadata._isFromFolder || false
                        const folderName = fileWithMetadata._folderName || ''
                        
                        // Get relative path from webkitRelativePath if available
                        let relativePath = file.name // Default to just filename
                        if (isFromFolder && 'webkitRelativePath' in file) {
                            const webkitPath = (file as any).webkitRelativePath
                            if (webkitPath && typeof webkitPath === 'string' && webkitPath.trim() !== '') {
                                relativePath = webkitPath
                            }
                        }
                        
                        uploadedFiles.push({
                            ...uploadData,
                            fieldId: field.id,
                            label: field.label,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            isFromFolder: isFromFolder,
                            folderName: folderName,
                            relativePath: relativePath
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
                    submitterName: session?.user?.name || null,
                    submitterEmail: session?.user?.email || null,
                    authProvider: session ? "google" : null,
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
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 py-4 sm:py-8">
            {isPreview && (
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md mb-4 text-center font-medium border border-yellow-200 text-xs sm:text-sm">
                    Preview Mode - No files will be stored
                </div>
            )}

            {config?.logoUrl && (
                <div className="flex justify-center mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.logoUrl} alt="Form logo" className="h-12 sm:h-16 md:h-20 object-contain" />
                </div>
            )}

            {step === 'auth' && (
                <Card className={cn(cardClasses, "border-0 sm:border")}>
                    <CardHeader className="text-center px-4 sm:px-6">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl">Protected Form</CardTitle>
                        <CardDescription className="text-sm">Please enter the password to continue.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleAuth}>
                        <CardContent className="space-y-4 px-4 sm:px-6">
                            <div className="space-y-2">
                                <Label className="text-sm">Password</Label>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={cn("h-11 sm:h-10", authError ? "border-red-500" : "")} />
                                {authError && <p className="text-xs sm:text-sm text-red-500">{authError}</p>}
                            </div>
                        </CardContent>
                        <CardFooter className="px-4 sm:px-6 pb-6">
                            <Button className="w-full h-11" type="submit" style={{ backgroundColor: primaryColor, color: buttonTextColor }}>Access Form</Button>
                        </CardFooter>
                    </form>
                </Card>
            )}

            {step === 'google_auth' && (
                <Card className={cn(cardClasses, "border-0 sm:border")}>
                    <CardHeader className="text-center px-4 sm:px-6">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl">Sign In Required</CardTitle>
                        <CardDescription className="text-sm">
                            {isDomainBlocked 
                                ? "Access Denied" 
                                : "Please sign in with your Google account to access this form."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 sm:px-6 text-center">
                        {isDomainBlocked ? (
                            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-100 text-sm">
                                <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-600" />
                                <p>{error}</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-4 w-full"
                                    onClick={() => window.location.reload()}
                                >
                                    Try Another Account
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    This form requires a verified Google identity to prevent anonymous submissions.
                                </p>
                                <Button 
                                    className="w-full h-12 flex items-center justify-center gap-3 font-semibold"
                                    onClick={() => signIn('google')}
                                    style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Sign In with Google
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {step === 'form' && (
                <Card className={cn(cardClasses, "border-0 sm:border")}>
                    <CardHeader className="px-4 sm:px-6">
                        <CardTitle className="text-xl sm:text-2xl">{config?.title || "File Upload"}</CardTitle>
                        <CardDescription className="text-sm sm:text-base">{config?.description || "Please fill in your details and upload your file."}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUpload}>
                        <CardContent className="space-y-6 px-4 sm:px-6">
                            {(() => {
                                // Filter to only show fields with filled labels
                                const filledQuestions = config?.customQuestions?.filter(q => q.label && q.label.trim() !== '') || []
                                const filledUploadFields = config?.uploadFields?.filter(field => field.label && field.label.trim() !== '') || []
                                
                                // Validation: Check what's missing
                                const missingItems: string[] = []
                                
                                // Check form title (allow "Untitled Form" as valid)
                                const title = config?.title || ''
                                if (!title || title.trim() === '') {
                                    missingItems.push('Form title')
                                }
                                
                                // Check file upload fields
                                if (filledUploadFields.length === 0) {
                                    missingItems.push('At least one file upload field')
                                }
                                
                                // Check required custom questions configuration
                                const customQuestions = config?.customQuestions || []
                                const requiredQuestions = customQuestions.filter((q: CustomQuestion) => q.required === true)
                                const invalidRequiredQuestions = requiredQuestions.filter((q: CustomQuestion) => {
                                    if (!q.label || q.label.trim() === '') return true
                                    if ((q.type === 'select' || q.type === 'radio' || q.type === 'checkbox')) {
                                        if (!q.options || q.options.length === 0 || q.options.every((opt: string) => !opt || opt.trim() === '')) {
                                            return true
                                        }
                                    }
                                    return false
                                })
                                
                                if (invalidRequiredQuestions.length > 0) {
                                    missingItems.push('Required question fields configuration')
                                }
                                
                                // Show error message if anything is missing
                                if (missingItems.length > 0) {
                                    // Admin view (preview mode or form owner) - show detailed errors
                                    if (isFormOwner) {
                                        return (
                                            <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 sm:px-6 py-6 sm:py-8 space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                                                    <div className="flex-1 space-y-3">
                                                        <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                                                            Form Setup Incomplete
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-700">
                                                            Please complete the following before publishing this form:
                                                        </p>
                                                        <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-700 ml-1">
                                                            {missingItems.map((item, index) => (
                                                                <li key={index}>{item}</li>
                                                            ))}
                                                        </ul>
                                                        <div className="pt-2 border-t border-orange-200">
                                                            <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                                                                <strong>What to do:</strong> Go back to the form editor and fill in the missing information.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    
                                    // Regular uploader view - show generic message
                                    return (
                                        <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 px-4 sm:px-6 py-6 sm:py-8 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <p className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                                                        This page isn't ready yet
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                                        The form creator hasn't finished setting up this form. Please contact the person who shared this link.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                                
                                return (
                                    <>
                            {/* Custom Questions */}
                            {filledQuestions.map((q) => (
                                <div key={q.id} className="space-y-2.5">
                                    <Label className="text-sm sm:text-base font-medium">
                                        {q.label}
                                        {q.required && <span className="text-red-500 ml-1">*</span>}
                                    </Label>

                                    {q.type === 'text' && (
                                        <Input
                                            required={q.required}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            className="h-11 sm:h-10"
                                        />
                                    )}

                                    {q.type === 'textarea' && (
                                        <Textarea
                                            required={q.required}
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            className="min-h-[100px] text-sm sm:text-base"
                                        />
                                    )}

                                    {q.type === 'select' && (
                                        <Select onValueChange={(val) => handleAnswerChange(q.id, val)} required={q.required}>
                                            <SelectTrigger className="h-11 sm:h-10">
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
                                        <div className="pt-1">
                                            <RadioGroup onValueChange={(val) => handleAnswerChange(q.id, val)} required={q.required} className="gap-3">
                                                {q.options?.map((opt) => (
                                                    <div key={opt} className="flex items-center space-x-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                                                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                                                        <Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-sm sm:text-base font-normal">{opt}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                    )}

                                    {q.type === 'checkbox' && (
                                        <div className="pt-1 space-y-2.5">
                                            {(q.options && q.options.length > 0 ? q.options : ['Yes']).map((opt) => {
                                                const current = answers[q.id]
                                                const selected = Array.isArray(current) ? current.includes(opt) : !!current && current === opt

                                                const toggleOption = () => {
                                                    let next: any[] = []
                                                    if (Array.isArray(current)) {
                                                        next = current.includes(opt) ? current.filter((v: any) => v !== opt) : [...current, opt]
                                                    } else {
                                                        next = current && current !== opt ? [current, opt] : (!current ? [opt] : [])
                                                    }
                                                    handleAnswerChange(q.id, next)
                                                }

                                                return (
                                                    <div key={opt} className="flex items-center space-x-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 cursor-pointer" onClick={toggleOption}>
                                                        <input
                                                            type="checkbox"
                                                            id={`${q.id}-${opt}`}
                                                            className="h-4 w-4 rounded border-gray-300 pointer-events-none"
                                                            style={{ accentColor: primaryColor }}
                                                            checked={selected}
                                                            readOnly
                                                        />
                                                        <Label className="flex-1 cursor-pointer text-sm sm:text-base font-normal pointer-events-none">{opt}</Label>
                                                    </div>
                                                )
                                            })}

                                            {('allowOther' in q && (q as any).allowOther) && (() => {
                                                const opt = 'Other'
                                                const current = answers[q.id]
                                                const selected = Array.isArray(current) ? current.includes(opt) : !!current && current === opt
                                                const otherKey = `${q.id}__other`
                                                const otherValue = (answers as any)[otherKey] || ''

                                                return (
                                                    <div key={`${q.id}-other`} className="flex flex-col gap-2 p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
                                                            let next: any[] = []
                                                            if (Array.isArray(current)) {
                                                                next = current.includes(opt) ? current.filter((v: any) => v !== opt) : [...current, opt]
                                                            } else {
                                                                next = current && current !== opt ? [current, opt] : (!current ? [opt] : [])
                                                            }
                                                            handleAnswerChange(q.id, next)
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 pointer-events-none"
                                                                style={{ accentColor: primaryColor }}
                                                                checked={selected}
                                                                readOnly
                                                            />
                                                            <span className="text-sm sm:text-base text-gray-700 font-normal">Other</span>
                                                        </div>
                                                        {selected && (
                                                            <div className="pl-7">
                                                                <Input
                                                                    value={otherValue}
                                                                    onChange={(e) => handleAnswerChange(otherKey, e.target.value)}
                                                                    placeholder="Please specify"
                                                                    className="h-9 text-sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}

                                    {questionErrors[q.id] && (
                                        <p className="text-xs sm:text-sm text-red-500 mt-1">
                                            {questionErrors[q.id]}
                                        </p>
                                    )}
                                </div>
                            ))}

                            {/* Upload Fields */}
                            <div className="space-y-6 pt-2">
                                {filledUploadFields.map((field) => (
                                    <div key={field.id} className="p-0 sm:p-0">
                                        <FileDropzone
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
                                            onViewFolder={(fieldId, folderName) => setViewingFolder({ fieldId, folderName })}
                                        />
                                    </div>
                                ))}
                            </div>
                                </>
                                )
                            })()}

                        </CardContent>
                        {(() => {
                            const filledQuestions = config?.customQuestions?.filter(q => q.label && q.label.trim() !== '') || []
                            const filledUploadFields = config?.uploadFields?.filter(field => field.label && field.label.trim() !== '') || []
                            
                            return (filledQuestions.length > 0 || filledUploadFields.length > 0) && (
                                <CardFooter className="px-4 sm:px-6 pb-8">
                                    <Button className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" type="submit" disabled={uploading} style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
                                        {uploading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</> : "Submit Upload"}
                                    </Button>
                                </CardFooter>
                            )
                        })()}
                    </form>
                </Card>
            )}

            {step === 'success' && (
                <Card className={cn(cardClasses, "text-center border-0 sm:border")}>
                    <CardHeader className="px-4 sm:px-6 pt-8">
                        <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
                            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl text-green-700">Successful!</CardTitle>
                        <CardDescription className="text-sm sm:text-base">Your files have been securely uploaded.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-4 sm:px-6">
                        <div className="bg-muted/50 p-4 sm:p-6 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Reference ID</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <code className="text-lg sm:text-xl font-mono font-bold text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm break-all">{referenceId}</code>
                                <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg bg-white" onClick={() => {
                                    navigator.clipboard.writeText(referenceId)
                                    // Add a small toast or visual feedback here if needed
                                }}>Copy ID</Button>
                            </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            Your upload has been recorded. Save this reference ID for your records.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 px-4 sm:px-6 pb-10">
                        {config?.enableSubmitAnother && (
                            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={resetForm}>
                                <RefreshCcw className="w-4 h-4 mr-2" /> Submit Another Response
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}
            
            {/* Folder Viewer Modal */}
            {viewingFolder && (() => {
                const fieldFiles = files[viewingFolder.fieldId] || []
                const folderFiles = fieldFiles.filter(f => 
                    f._isFromFolder && f._folderName === viewingFolder.folderName
                )
                const totalSize = folderFiles.reduce((acc, f) => acc + f.size, 0)
                
                const formatFileSize = (bytes: number): string => {
                    if (bytes === 0) return '0 Bytes'
                    const k = 1024
                    const sizes = ['Bytes', 'KB', 'MB', 'GB']
                    const i = Math.floor(Math.log(bytes) / Math.log(k))
                    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
                }
                
                const getFileIcon = (file: File) => {
                    const type = file.type
                    const className = "w-6 h-6 text-blue-600"
                    
                    if (type.includes('image')) return <BsImage className={className} />
                    if (type.includes('pdf')) return <BsFileEarmarkPdf className={className} />
                    if (type.includes('word')) return <BsFileEarmarkWord className={className} />
                    if (type.includes('excel') || type.includes('spreadsheet')) return <BsFileEarmarkExcel className={className} />
                    return <BsFileEarmarkText className={className} />
                }
                
                return (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => setViewingFolder(null)}>
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-4 border-b flex items-center justify-between bg-blue-50">
                                <div className="flex items-center gap-3">
                                    <Folder className="w-6 h-6 text-blue-600" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {viewingFolder.folderName}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {folderFiles.length} {folderFiles.length === 1 ? 'file' : 'files'} • {formatFileSize(totalSize)}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setViewingFolder(null)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            {/* File List */}
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-2">
                                    {folderFiles.map((file, index) => (
                                        <div key={`${file.name}-${index}`}
                                            className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex-shrink-0">{getFileIcon(file)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="p-4 border-t bg-gray-50 flex justify-end">
                                <Button variant="outline" onClick={() => setViewingFolder(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}