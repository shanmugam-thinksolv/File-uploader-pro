"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Upload, Link2, Copy, Check, ArrowLeft, ChevronRight, Loader2, Globe, Mail, QrCode, Trash2, Plus, GripVertical, X, FilePlus, Eye } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { QRCodeCanvas } from "qrcode.react"
import { AccessTab } from './components/AccessTab';
import { TabTransition } from './components/TabTransition';
import { GooglePickerFolderSelect } from './components/GooglePickerFolderSelect';
import { BrandLoader } from './components/BrandLoader';
import { EditorFormData, UploadField, CustomQuestion } from './types';
import { AlertTriangle } from "lucide-react";

function LivePreviewSection({ q }: { q: CustomQuestion }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-2 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full text-left focus:outline-none group"
            >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex-1">Live Preview</span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} group-hover:text-indigo-500`} />
            </button>

            {isOpen && (
                <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm pointer-events-none select-none opacity-90 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            {q.label || 'Question Label'}
                            {q.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>

                        {q.type === 'text' && (
                            <div className="space-y-1">
                                <Input
                                    placeholder={q.placeholder}
                                    className="bg-white"
                                />
                                <p className="text-xs text-gray-400 text-right">0/{q.wordLimit || 3} words</p>
                            </div>
                        )}

                        {q.type === 'textarea' && (
                            <div className="space-y-1">
                                <Textarea
                                    placeholder={q.placeholder}
                                    className="bg-white resize-none"
                                />
                                <p className="text-xs text-gray-400 text-right">0/{q.wordLimit || 50} words</p>
                            </div>
                        )}

                        {q.type === 'select' && (
                            <Select>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {q.options?.map((opt, i) => (
                                        <SelectItem key={i} value={opt || `opt-${i}`}>{opt || `Option ${i + 1}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {q.type === 'radio' && (
                            <RadioGroup className="space-y-2">
                                {q.options?.map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt || `opt-${i}`} id={`preview-radio-${q.id}-${i}`} />
                                        <Label htmlFor={`preview-radio-${q.id}-${i}`} className="font-normal">{opt || `Option ${i + 1}`}</Label>
                                    </div>
                                ))}
                                {q.allowOther && (
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="other" id={`preview-radio-${q.id}-other`} />
                                        <Label htmlFor={`preview-radio-${q.id}-other`} className="font-normal text-gray-500">Other...</Label>
                                    </div>
                                )}
                            </RadioGroup>
                        )}

                        {q.type === 'checkbox' && (
                            <div className="space-y-2">
                                {q.options?.map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <div className="h-4 w-4 rounded border border-gray-300 bg-white" />
                                        <Label className="font-normal">{opt || `Option ${i + 1}`}</Label>
                                    </div>
                                ))}
                                {q.allowOther && (
                                    <div className="flex items-center space-x-2">
                                        <div className="h-4 w-4 rounded border border-gray-300 bg-white" />
                                        <Label className="font-normal text-gray-500">Other...</Label>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function DriveConnectionStatus({ formData, updateField }: { formData: EditorFormData, updateField: (field: keyof EditorFormData, value: any) => void }) {
    const { data: session, status } = useSession();
    const loading = status === "loading";
    const isConnected = !!session; // Simplified check, ideally check for specific scope or token presence if possible

    if (loading) return <div className="h-20 animate-pulse bg-gray-100 rounded-xl"></div>;

    if (!isConnected) {
        return (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-amber-900">Google Drive needs to be connected</h4>
                        <p className="text-xs text-amber-700">
                            Uploads are saved to your Google Drive. You must connect your account to continue.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    onClick={() => window.location.href = '/api/auth/signin/google'}
                >
                    Connect Google Drive
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 animate-in fade-in slide-in-from-top-2">
            <GooglePickerFolderSelect formData={formData} updateField={updateField} />
        </div>
    );
}

function EditorContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { data: session } = useSession()
    const formId = searchParams.get("id")


    const [isPublishOpen, setIsPublishOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const [logoUploading, setLogoUploading] = useState(false)
    const [coverUploading, setCoverUploading] = useState(false)
    const [showQrCode, setShowQrCode] = useState(false)
    const [showLivePreview, setShowLivePreview] = useState(false)
    const [shortenLoading, setShortenLoading] = useState(false)

    const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    })

    // Auto-save
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState<EditorFormData>({
        id: "",
        title: "New Form",
        description: "",
        allowedTypes: "any",
        driveEnabled: true,
        driveFolderId: "",
        driveFolderUrl: "",
        driveFolderName: "",
        isAcceptingResponses: true,
        expiryDate: null as string | null,
        enableMetadataSpreadsheet: false,
        subfolderOrganization: "NONE",
        customSubfolderField: "",
        enableSmartGrouping: false,
        logoUrl: "",
        primaryColor: "#4f46e5",
        secondaryColor: "#ffffff",
        backgroundColor: "#f3f4f6",
        fontFamily: "Inter",
        accessLevel: "ANYONE",
        allowedEmails: "",

        emailFieldControl: "OPTIONAL",
        accessProtectionType: "PUBLIC",
        password: "",
        accessProtection: "public",
        driveIntegrationEnabled: true,
        allowedDomains: [],
        uploadFields: [] as UploadField[],
        customQuestions: [] as CustomQuestion[],
        buttonTextColor: "#ffffff",
        cardStyle: "shadow",
        borderRadius: "md",
        coverImageUrl: "",
        isPublished: false,
    })

    const [isDraggingLogo, setIsDraggingLogo] = useState(false)
    const [isDraggingCover, setIsDraggingCover] = useState(false)

    const updateField = <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }



    const showMessage = (title: string, message: string, type: 'success' | 'error' = 'error') => {
        setMessageModal({ isOpen: true, title, message, type })
    }

    useEffect(() => {
        if (formId && formId !== 'new') {
            fetch(`/api/forms/${formId}`)
                .then(res => res.json())
                .then(data => {
                    // Parse JSON fields if they are strings (from DB)
                    const uploadFields = typeof data.uploadFields === 'string' ? JSON.parse(data.uploadFields) : data.uploadFields || []
                    const customQuestions = typeof data.customQuestions === 'string' ? JSON.parse(data.customQuestions) : data.customQuestions || []

                    setFormData(prev => ({
                        ...prev,
                        ...data,
                        uploadFields,
                        customQuestions
                    }))
                })
                .catch(err => console.error('Failed to load form', err))
        }
    }, [formId])

    // Auto-save effect with debouncing
    const autoSave = useCallback(async () => {
        if (!formId || formId === 'new') return

        setIsSaving(true)
        try {
            await fetch(`/api/forms/${formId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
        } catch (error) {
            console.error('Auto-save failed:', error)
        } finally {
            setIsSaving(false)
        }
    }, [formId, formData])

    useEffect(() => {
        if (!formId || formId === 'new') return

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Debounce: save 1 second after last change
        saveTimeoutRef.current = setTimeout(() => {
            autoSave()
        }, 1000)

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [formData, formId, autoSave])

    const handleSave = async () => {
        setLoading(true)
        try {
            const method = formId && formId !== 'new' ? 'PUT' : 'POST'
            const url = formId && formId !== 'new' ? `/api/forms/${formId}` : '/api/forms'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                router.push('/admin/dashboard')
            }
        } catch (error) {
            console.error('Save failed:', error)
            showMessage('Error', 'Failed to save form', 'error')
        } finally {
            setLoading(false)
        }
    }

    const uploadAsset = async (file: File, field: 'logoUrl' | 'coverImageUrl') => {
        const setLoadingState = field === 'logoUrl' ? setLogoUploading : setCoverUploading
        setLoadingState(true)
        try {
            const formDataObj = new FormData()
            formDataObj.append('file', file)
            if (formData.driveFolderId) {
                formDataObj.append('parentFolderId', formData.driveFolderId)
            }
            formDataObj.append('formTitle', formData.title || 'Untitled Form')

            const res = await fetch('/api/drive/upload-asset', {
                method: 'POST',
                body: formDataObj
            })

            if (res.ok) {
                const data = await res.json()
                updateField(field, data.url)

                // If the API created a new folder and returned its ID, update our state
                if (data.folderId && !formData.driveFolderId) {
                    updateField('driveFolderId', data.folderId)
                    showMessage('Folder Created', `Created new folder "${formData.title || 'Untitled Form'}" for assets.`, 'success')
                }
            } else {
                const err = await res.json()
                console.error('❌ Upload failed:', err)
                showMessage('Upload Failed', err.error || 'Upload failed', 'error')
            }
        } catch (error) {
            console.error('Upload error:', error)
            showMessage('Error', 'Upload failed', 'error')
        } finally {
            setLoadingState(false)
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) uploadAsset(file, 'logoUrl')
    }

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) uploadAsset(file, 'coverImageUrl')
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleLogoDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingLogo(true)
    }

    const handleLogoDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingLogo(false)
    }

    const handleCoverDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingCover(true)
    }

    const handleCoverDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingCover(false)
    }

    const handleLogoDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingLogo(false)

        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            uploadAsset(file, 'logoUrl')
        }
    }

    const handleCoverDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingCover(false)

        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            uploadAsset(file, 'coverImageUrl')
        }
    }

    const removeLogo = () => {
        updateField('logoUrl', '')
    }

    const copyLink = () => {
        const link = formId ? `${window.location.origin}/upload/${formId}` : 'Save form first'
        navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShortenUrl = () => {
        setShortenLoading(true)
        // Mock shortening for now
        setTimeout(() => {
            setShortenLoading(false)
            navigator.clipboard.writeText(formId ? `${window.location.origin}/s/${formId.slice(0, 6)}` : '')
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }, 1000)
    }

    const addUploadField = () => {
        if (formData.uploadFields.length >= 3) return
        const newField = {
            id: crypto.randomUUID(),
            label: "Upload File",
            allowedTypes: "any",
            required: true
        }
        updateField('uploadFields', [...formData.uploadFields, newField])
    }

    const removeUploadField = (id: string) => {
        updateField('uploadFields', formData.uploadFields.filter(f => f.id !== id))
    }

    const updateUploadFieldItem = <K extends keyof UploadField>(id: string, key: K, value: UploadField[K]) => {
        updateField('uploadFields', formData.uploadFields.map(f =>
            f.id === id ? { ...f, [key]: value } : f
        ))
    }

    const addCustomQuestion = () => {
        const newQuestion = {
            id: crypto.randomUUID(),
            type: "text",
            label: "New Question",
            required: false,
            options: []
        }
        updateField('customQuestions', [...formData.customQuestions, newQuestion])
    }

    const removeCustomQuestion = (id: string) => {
        updateField('customQuestions', formData.customQuestions.filter(q => q.id !== id))
    }

    const updateCustomQuestionItem = <K extends keyof CustomQuestion>(id: string, key: K, value: CustomQuestion[K]) => {
        updateField('customQuestions', formData.customQuestions.map(q =>
            q.id === id ? { ...q, [key]: value } : q
        ))
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className={`mx-auto px-6 py-10 transition-all duration-300 max-w-3xl`}>
                {/* Navigation & Title */}
                <div className="mb-8 space-y-4">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{formData.title}</h1>
                        {isSaving && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                Saving...
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <div className="space-y-6">
                        {/* Modern Sticky Action Bar */}
                        <div className="sticky top-0 z-50 -mx-4 px-4 py-4 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm mb-6">
                            <div className="max-w-7xl mx-auto flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-100">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <span className="text-xs font-medium text-indigo-700">
                                            {isSaving ? 'Auto-saving...' : 'All changes saved'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="h-10 px-6 font-medium border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save Draft'}
                                    </Button>

                                    <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="h-10 px-8 font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-[1.02]">
                                                <Globe className="w-4 h-4 mr-2" />
                                                Publish
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl bg-white rounded-2xl">
                                            {/* Modern Header */}
                                            <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                                <Globe className="w-6 h-6 text-indigo-600" />
                                                            </div>
                                                            Publish & Share
                                                        </DialogTitle>
                                                        <DialogDescription className="text-gray-500 mt-2 text-base">
                                                            Your form is ready. Share it with the world or restrict access.
                                                        </DialogDescription>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${formData.isAcceptingResponses ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {formData.isAcceptingResponses ? 'Live' : 'Inactive'}
                                                        </span>
                                                        <Switch
                                                            checked={formData.isAcceptingResponses}
                                                            onCheckedChange={(c) => updateField('isAcceptingResponses', c)}
                                                            className="ml-2 data-[state=checked]:bg-indigo-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 space-y-8">
                                                {/* Link Section */}
                                                <div className="space-y-4">
                                                    <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Public Link</Label>
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1 group">
                                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                <Link2 className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                                            </div>
                                                            <Input
                                                                readOnly
                                                                value={formId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${formId}` : 'Save form first'}
                                                                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono text-sm rounded-xl text-gray-600"
                                                            />
                                                        </div>
                                                        <Button
                                                            size="lg"
                                                            className={`h-12 px-6 font-medium transition-all ${copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                                                            onClick={copyLink}
                                                        >
                                                            {copied ? (
                                                                <>
                                                                    <Check className="w-4 h-4 mr-2" />
                                                                    Copied
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="w-4 h-4 mr-2" />
                                                                    Copy
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Quick Actions Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={handleShortenUrl}
                                                        className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                            {shortenLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">Shorten URL</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">Get a compact link</div>
                                                        </div>
                                                    </button>

                                                    <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                                                        <DialogTrigger asChild>
                                                            <button className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left">
                                                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                                    <QrCode className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-semibold text-gray-900">QR Code</div>
                                                                    <div className="text-xs text-gray-500 mt-0.5">Scan to open on mobile</div>
                                                                </div>
                                                            </button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-sm flex flex-col items-center justify-center py-10">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-center">Scan to Upload</DialogTitle>
                                                                <DialogDescription className="text-center">
                                                                    Scan this QR code to open the upload form on your mobile device.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
                                                                <QRCodeCanvas
                                                                    value={formId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${formId}` : ''}
                                                                    size={200}
                                                                    level={"H"}
                                                                    includeMargin={true}
                                                                />
                                                            </div>
                                                            <Button className="mt-8 w-full" onClick={() => window.print()}>
                                                                Print QR Code
                                                            </Button>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>

                                                <div className="border-t border-gray-100"></div>

                                                {/* Access Control */}
                                                <div className="space-y-4">
                                                    <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Who can respond?</Label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div
                                                            onClick={() => updateField('accessLevel', 'ANYONE')}
                                                            className={`cursor-pointer relative flex items-start p-4 rounded-xl border-2 transition-all ${formData.accessLevel === 'ANYONE'
                                                                ? 'border-indigo-600 bg-indigo-50/30'
                                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${formData.accessLevel === 'ANYONE' ? 'border-indigo-600' : 'border-gray-300'}`}>
                                                                {formData.accessLevel === 'ANYONE' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="font-semibold text-gray-900">Public</div>
                                                                <div className="text-xs text-gray-500 mt-1">Anyone with the link can respond</div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            onClick={() => updateField('accessLevel', 'INVITED')}
                                                            className={`cursor-pointer relative flex items-start p-4 rounded-xl border-2 transition-all ${formData.accessLevel === 'INVITED'
                                                                ? 'border-indigo-600 bg-indigo-50/30'
                                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${formData.accessLevel === 'INVITED' ? 'border-indigo-600' : 'border-gray-300'}`}>
                                                                {formData.accessLevel === 'INVITED' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="font-semibold text-gray-900">Restricted</div>
                                                                <div className="text-xs text-gray-500 mt-1">Only invited people can respond</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {formData.accessLevel === 'INVITED' && (
                                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                                    <Input
                                                                        placeholder="Enter email addresses (comma separated)"
                                                                        value={formData.allowedEmails}
                                                                        onChange={(e) => updateField('allowedEmails', e.target.value)}
                                                                        className="pl-9"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => setIsPublishOpen(false)}
                                                    className="h-12 px-6"
                                                >
                                                    Close
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                                                    onClick={handleSave}
                                                    disabled={loading || !session}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                            Publishing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Publish Changes
                                                            <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                                        </>
                                                    )}
                                                </Button>
                                                {!session && (
                                                    <p className="text-xs text-red-500 mt-2 absolute bottom-2 right-6">
                                                        Connect Google Drive to publish.
                                                    </p>
                                                )}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>

                        {/* Professional Tab Navigation */}
                        <div className="mb-8 border-b border-gray-200">
                            <nav className=" flex -mb-px space-x-8" aria-label="Tabs">
                                {[
                                    { name: 'General', step: 0 },
                                    { name: 'Uploads', step: 1 },
                                    { name: 'Organization', step: 2 },
                                    { name: 'Access', step: 3 },
                                    { name: 'Design', step: 4 }
                                ].map((tab) => {
                                    const isActive = currentStep === tab.step;
                                    const isCompleted = currentStep > tab.step;

                                    return (
                                        <button
                                            key={tab.name}
                                            onClick={() => setCurrentStep(tab.step)}
                                            className={`
                                                group relative inline-flex items-center gap-2 py-4 px-1 
                                                border-b-2 font-medium text-sm transition-all duration-200
                                                ${isActive
                                                    ? 'border-gray-900 text-gray-900'
                                                    : isCompleted
                                                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        : 'border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-200'
                                                }
                                            `}
                                        >
                                            {/* Step number/checkmark */}
                                            <span
                                                className={`
                                                    flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold
                                                    transition-colors duration-200
                                                    ${isActive
                                                        ? 'bg-gray-900 text-white'
                                                        : isCompleted
                                                            ? 'bg-gray-100 text-gray-600'
                                                            : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                                    }
                                                `}
                                            >
                                                {isCompleted ? (
                                                    <Check className="w-3 h-3" />
                                                ) : (
                                                    tab.step + 1
                                                )}
                                            </span>

                                            {/* Tab label */}
                                            <span>{tab.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Step 0: General Information */}
                        {currentStep === 0 && (
                            <TabTransition>
                                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
                                    <div className="space-y-3">
                                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">General Information</h2>
                                        <p className="text-sm text-slate-500 leading-relaxed">Configure the basic details of your form</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="title" className="text-sm font-medium text-slate-700">Form Title</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => updateField('title', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="Enter form title"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                                            <Textarea
                                                id="description"
                                                className="min-h-[100px] resize-y w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                placeholder="Enter a description for your upload form..."
                                                value={formData.description || ''}
                                                onChange={(e) => updateField('description', e.target.value)}
                                            />
                                            <p className="text-xs text-slate-400 text-right">{formData.description?.length || 0}/1000 characters</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Questions Card */}
                                <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Form Questions</h2>
                                            <p className="text-sm text-slate-500 leading-relaxed">Ask users additional questions before they upload</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addCustomQuestion}
                                            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-medium hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Question
                                        </Button>
                                    </div>
                                    <div className="space-y-5">
                                        {formData.customQuestions.length === 0 ? (
                                            <div className="text-center p-10 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                                                    <Plus className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900 mb-1">No questions yet</h3>
                                                <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
                                                    Add custom questions to collect extra information from your uploaders.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addCustomQuestion}
                                                    className="bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 hover:border-indigo-200"
                                                >
                                                    Add Question
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-5">{formData.customQuestions.map((q, index) => (
                                                <div key={q.id} className="group relative bg-gradient-to-br from-slate-50 to-slate-100/30 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                                                    {/* Header: Drag & Delete */}
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-slate-300 cursor-move hover:text-slate-500 p-1.5 rounded-lg hover:bg-white transition-colors">
                                                                <GripVertical className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                            onClick={() => removeCustomQuestion(q.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Core Settings Grid */}
                                                    <div className="grid gap-5 sm:grid-cols-2 mb-5">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium text-slate-700">Question Label</Label>
                                                            <Input
                                                                value={q.label}
                                                                onChange={(e) => updateCustomQuestionItem(q.id, 'label', e.target.value)}
                                                                placeholder="e.g. What is your department?"
                                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium text-slate-700">Answer Type</Label>
                                                            <Select
                                                                value={q.type}
                                                                onValueChange={(val) => updateCustomQuestionItem(q.id, 'type', val)}
                                                            >
                                                                <SelectTrigger className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-slate-200">
                                                                    <SelectItem value="text">Short Text</SelectItem>
                                                                    <SelectItem value="textarea">Long Text</SelectItem>
                                                                    <SelectItem value="select">Dropdown</SelectItem>
                                                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Type Specific Configuration */}
                                                    <div className="space-y-4 pt-2">
                                                        <Label className="text-sm font-medium text-slate-700">Configuration</Label>

                                                        {/* Text / Textarea Config */}
                                                        {(q.type === 'text' || q.type === 'textarea') && (
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-normal text-slate-500">Placeholder Text</Label>
                                                                <Input
                                                                    value={q.placeholder || ''}
                                                                    onChange={(e) => updateCustomQuestionItem(q.id, 'placeholder', e.target.value)}
                                                                    placeholder="e.g. Type your answer here..."
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Options Config (Select, Radio, Checkbox) */}
                                                        {(q.type === 'select' || q.type === 'radio' || q.type === 'checkbox') && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm font-normal text-slate-500">Options (comma separated)</Label>
                                                                    <Textarea
                                                                        value={q.options?.join(', ') || ''}
                                                                        onChange={(e) => updateCustomQuestionItem(q.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                                        placeholder="Option 1, Option 2, Option 3"
                                                                        className="min-h-[80px] w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 font-mono text-sm resize-none"
                                                                    />
                                                                    <p className="text-xs text-slate-400">Separate options with commas</p>
                                                                </div>

                                                                {(q.type === 'radio' || q.type === 'checkbox') && (
                                                                    <div className="flex items-center space-x-3">
                                                                        <Switch
                                                                            checked={q.allowOther || false}
                                                                            onCheckedChange={(c) => updateCustomQuestionItem(q.id, 'allowOther', c)}
                                                                            id={`allow-other-${q.id}`}
                                                                            className="data-[state=checked]:bg-indigo-600"
                                                                        />
                                                                        <Label htmlFor={`allow-other-${q.id}`} className="text-sm font-normal text-slate-600">Allow "Other" option</Label>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Common Toggles */}
                                                        <div className="flex items-center space-x-3 pt-2">
                                                            <Switch
                                                                checked={q.required}
                                                                onCheckedChange={(c) => updateCustomQuestionItem(q.id, 'required', c)}
                                                                id={`required-${q.id}`}
                                                                className="data-[state=checked]:bg-indigo-600"
                                                            />
                                                            <Label htmlFor={`required-${q.id}`} className="text-sm font-normal text-slate-600">Required field</Label>
                                                        </div>
                                                    </div>

                                                    {/* Live Preview */}
                                                    <LivePreviewSection q={q} />
                                                </div>
                                            ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabTransition>
                        )}

                        {/* Step 1: Upload Settings */}
                        {/* Step 1: Upload Settings */}
                        {currentStep === 1 && (
                            <TabTransition>
                                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
                                    <div className="space-y-3">
                                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Upload Settings</h2>
                                        <p className="text-sm text-slate-500 leading-relaxed">Configure file upload fields and storage</p>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Google Drive Integration */}
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-slate-700">Google Drive Storage</Label>
                                                <p className="text-sm text-slate-500 leading-relaxed">Uploads are always saved to your Google Drive. Choose a custom folder below (optional).</p>
                                            </div>

                                            <DriveConnectionStatus formData={formData} updateField={updateField} />
                                        </div>

                                        {/* Multiple Upload Fields */}
                                        <div className="space-y-6 pt-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium text-slate-700">File Upload Fields</Label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addUploadField}
                                                    disabled={formData.uploadFields.length >= 3}
                                                    className="px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-medium hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Field
                                                </Button>
                                            </div>
                                            {formData.uploadFields.map((field, index) => (
                                                <div key={field.id} className="group relative flex items-start gap-4 bg-gradient-to-br from-slate-50 to-slate-100/30 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">
                                                    <div className="text-slate-300 cursor-move hover:text-slate-500 p-1.5 rounded-lg hover:bg-white transition-colors">
                                                        <GripVertical className="w-5 h-5" />
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-4 right-4 h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                        onClick={() => removeUploadField(field.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>

                                                    <div className="flex-1 space-y-5">
                                                        <div className="grid gap-5 sm:grid-cols-2">
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-slate-700">Field Name</Label>
                                                                <Input
                                                                    value={field.label}
                                                                    onChange={(e) => updateUploadFieldItem(field.id, 'label', e.target.value)}
                                                                    placeholder="e.g. Resume"
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-medium text-slate-700">Allowed Types</Label>
                                                                <Select
                                                                    value={field.allowedTypes}
                                                                    onValueChange={(val) => updateUploadFieldItem(field.id, 'allowedTypes', val)}
                                                                >
                                                                    <SelectTrigger className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-xl border-slate-200">
                                                                        <SelectItem value="any">Any file</SelectItem>
                                                                        <SelectItem value="images">Images only</SelectItem>
                                                                        <SelectItem value="docs">Documents only</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.uploadFields.length === 0 && (
                                                <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                                                    <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                                                        <FilePlus className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-sm font-medium text-slate-900">No file upload fields added</h3>
                                                        <p className="text-sm text-slate-500 font-normal max-w-xs mx-auto">
                                                            Add a field to allow users to upload files.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={addUploadField}
                                                        className="mt-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-medium hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" />
                                                        Add Field
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabTransition>
                        )}

                        {/* Step 2: Organization */}
                        {/* Step 2: Organization */}
                        {currentStep === 2 && (
                            <TabTransition>
                                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
                                    <div className="space-y-3">
                                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Organization</h2>
                                        <p className="text-sm text-slate-500 leading-relaxed">Configure how uploads are organized and tracked</p>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-slate-900">Metadata Spreadsheet</Label>
                                                <p className="text-sm text-slate-500 font-normal">Track upload details in a sheet</p>
                                            </div>
                                            <Switch
                                                checked={formData.enableMetadataSpreadsheet}
                                                onCheckedChange={(c) => updateField('enableMetadataSpreadsheet', c)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-slate-900">Subfolder Organization</Label>
                                                    <p className="text-sm text-slate-500 font-normal">Create subfolders for uploads</p>
                                                </div>
                                                <Switch
                                                    checked={formData.subfolderOrganization !== "NONE"}
                                                    onCheckedChange={(c) => updateField('subfolderOrganization', c ? "DATE" : "NONE")}
                                                    className="data-[state=checked]:bg-indigo-600"
                                                />
                                            </div>

                                            {formData.subfolderOrganization !== "NONE" && (
                                                <div className="space-y-4 pl-6 border-l-2 border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-medium text-slate-700">Subfolder Name Pattern</Label>
                                                        <Input
                                                            value={formData.customSubfolderField ?? "{Date} {Uploader Name}"}
                                                            onChange={(e) => updateField('customSubfolderField', e.target.value)}
                                                            className="font-mono text-sm w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {['{Date}', '{Uploader Name}', '{Form Title}', '{Email}'].map((tag) => {
                                                                const currentVal = formData.customSubfolderField ?? "{Date} {Uploader Name}";
                                                                const isSelected = currentVal.includes(tag);

                                                                return (
                                                                    <Button
                                                                        key={tag}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        type="button"
                                                                        className={`h-auto px-3 py-1.5 text-xs rounded-lg font-medium transition-all shadow-sm ${isSelected
                                                                            ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
                                                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                                                                            }`}
                                                                        onClick={() => {
                                                                            let newVal;
                                                                            if (isSelected) {
                                                                                newVal = currentVal.replace(tag, '').replace(/\s\s+/g, ' ').trim();
                                                                            } else {
                                                                                newVal = (currentVal + ' ' + tag).trim();
                                                                            }
                                                                            updateField('customSubfolderField', newVal);
                                                                        }}
                                                                    >
                                                                        {isSelected ? <X className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                                                        {tag}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabTransition>
                        )}

                        {/* Step 3: Availability & Access */}
                        {currentStep === 3 && (
                            <TabTransition>
                                <AccessTab formData={formData} updateField={updateField} />
                            </TabTransition>
                        )}

                        {/* Step 4: Design */}
                        {currentStep === 4 && (
                            <TabTransition>
                                <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Design & Branding</h2>
                                                <p className="text-sm text-slate-500 leading-relaxed">Customize your form's visual appearance</p>
                                            </div>
                                            <Button
                                                onClick={() => setShowLivePreview(true)}
                                                size="sm"
                                                variant="outline"
                                                className="px-4 py-2 rounded-xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 font-medium hover:bg-indigo-100 hover:border-indigo-200 transition-all shadow-sm"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Preview
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Logo & Cover Image */}
                                        <div className="space-y-5">
                                            <Label className="text-sm font-medium text-slate-900">Branding Assets</Label>
                                            <div className="space-y-5">
                                                {/* Logo Row */}
                                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div>
                                                        <Label className="text-sm font-medium text-slate-900">Logo</Label>
                                                        <p className="text-xs text-slate-500 mt-1">Upload your company logo (PNG, JPG, SVG)</p>
                                                    </div>
                                                    <div>
                                                        {formData.logoUrl ? (
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-14 w-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2 shadow-sm">
                                                                    <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={removeLogo}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer group">
                                                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all ${isDraggingLogo ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}>
                                                                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Upload Logo</span>
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                                                    onChange={handleLogoUpload}
                                                                    disabled={logoUploading}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Background Cover Row */}
                                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                    <div>
                                                        <Label className="text-sm font-medium text-slate-900">Background Cover</Label>
                                                        <p className="text-xs text-slate-500 mt-1">Add a cover image (1920x1080 recommended)</p>
                                                    </div>
                                                    <div>
                                                        {formData.coverImageUrl ? (
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-14 w-24 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                                                    <img src={formData.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => updateField('coverImageUrl', '')}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <label className="cursor-pointer group">
                                                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all ${isDraggingCover ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}>
                                                                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Upload Cover</span>
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    accept="image/png,image/jpeg,image/jpg"
                                                                    onChange={handleCoverUpload}
                                                                    disabled={coverUploading}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100"></div>

                                        {/* Button Style & Card Style */}
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium text-slate-900">Primary Color</Label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Input
                                                                type="color"
                                                                value={formData.primaryColor || "#000000"}
                                                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                                                className="h-12 w-12 p-1 rounded-xl border-2 border-slate-200 cursor-pointer"
                                                            />
                                                        </div>
                                                        <Input
                                                            type="text"
                                                            value={formData.primaryColor || "#000000"}
                                                            onChange={(e) => updateField('primaryColor', e.target.value)}
                                                            className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm uppercase focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium text-slate-900">Background Color</Label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Input
                                                                type="color"
                                                                value={formData.backgroundColor || "#ffffff"}
                                                                onChange={(e) => updateField('backgroundColor', e.target.value)}
                                                                className="h-12 w-12 p-1 rounded-xl border-2 border-slate-200 cursor-pointer"
                                                            />
                                                        </div>
                                                        <Input
                                                            type="text"
                                                            value={formData.backgroundColor || "#ffffff"}
                                                            onChange={(e) => updateField('backgroundColor', e.target.value)}
                                                            className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm uppercase focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 pt-2">
                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium text-slate-900">Card Style</Label>
                                                    <Select
                                                        value={formData.cardStyle || "shadow"}
                                                        onValueChange={(val) => updateField('cardStyle', val as "shadow" | "flat" | "border")}
                                                    >
                                                        <SelectTrigger className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            <SelectItem value="shadow">Shadow (Elevated)</SelectItem>
                                                            <SelectItem value="flat">Flat (Minimal)</SelectItem>
                                                            <SelectItem value="border">Bordered (Outline)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-sm font-medium text-slate-900">Corner Radius</Label>
                                                    <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                                                        {[
                                                            { value: "none", label: "0" },
                                                            { value: "sm", label: "4" },
                                                            { value: "md", label: "8" },
                                                            { value: "lg", label: "16" },
                                                            { value: "full", label: "24" }
                                                        ].map((option) => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => updateField('borderRadius', option.value as any)}
                                                                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${(formData.borderRadius || "md") === option.value
                                                                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                                                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                                                                    }`}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                </div>

                                {/* Live Preview Dialog */}
                                <Dialog open={showLivePreview} onOpenChange={setShowLivePreview}>
                                    <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden gap-0">
                                        <DialogHeader className="px-8 pt-6 pb-4 border-b border-gray-100">
                                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                                <Eye className="w-5 h-5 text-indigo-600" />
                                                Live Preview
                                            </DialogTitle>
                                            <DialogDescription>
                                                Real-time preview of your form's appearance
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="p-8 overflow-y-auto h-full">
                                            {/* Preview Container */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 min-h-full relative overflow-hidden shadow-inner flex items-center justify-center">
                                                {/* Cover Image Preview */}
                                                {formData.coverImageUrl && (
                                                    <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden rounded-t-2xl">
                                                        <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-100"></div>
                                                    </div>
                                                )}

                                                {/* Form Preview Content */}
                                                <div className={`relative w-full ${formData.coverImageUrl ? 'mt-20' : ''}`}>
                                                    {/* Logo Preview */}
                                                    {formData.logoUrl && (
                                                        <div className="flex justify-center mb-8">
                                                            <img src={formData.logoUrl} alt="Logo" className="max-h-20 object-contain drop-shadow-lg" />
                                                        </div>
                                                    )}

                                                    {/* Sample Form Card */}
                                                    <div className={`w-full bg-white rounded-2xl p-10 ${formData.cardStyle === 'shadow' ? 'shadow-2xl border border-gray-100' :
                                                        formData.cardStyle === 'border' ? 'border-2 border-gray-300' :
                                                            'border border-gray-200'
                                                        }`}>
                                                        <div className="text-center mb-8">
                                                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{formData.title || 'Your Form Title'}</h3>
                                                            <p className="text-base text-gray-600">{formData.description || 'Form description will appear here'}</p>
                                                        </div>

                                                        {/* Sample Fields */}
                                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium text-gray-700">Name</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Enter your name..."
                                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                                    disabled
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-medium text-gray-700">Email</label>
                                                                <input
                                                                    type="email"
                                                                    placeholder="your.email@example.com"
                                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Sample Button */}
                                                        <div className="flex justify-center">
                                                            <button
                                                                className="px-12 py-3 rounded-lg font-semibold transition-all shadow-sm"
                                                                style={{
                                                                    backgroundColor: formData.buttonTextColor === 'solid' ? formData.primaryColor : 'transparent',
                                                                    backgroundImage: formData.buttonTextColor === 'gradient' ? `linear-gradient(to right, ${formData.primaryColor}, ${formData.primaryColor}dd)` : 'none',
                                                                    borderColor: formData.buttonTextColor === 'outline' ? formData.primaryColor : 'transparent',
                                                                    borderWidth: formData.buttonTextColor === 'outline' ? '2px' : '0',
                                                                    color: formData.buttonTextColor === 'solid' || formData.buttonTextColor === 'gradient' ? '#ffffff' : formData.primaryColor
                                                                }}
                                                                disabled
                                                            >
                                                                Submit Button
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Preview Note */}
                                                    <p className="text-xs text-center text-gray-500 mt-6 italic">
                                                        ✨ Changes appear instantly
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </TabTransition>
                        )}


                        {/* Sticky Bottom Navigation */}
                        <div className="sticky bottom-0 -mx-6 -mb-10 px-6 py-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 flex justify-between items-center z-40 mt-8 transition-all duration-200">
                            <div className="text-sm text-slate-500 font-medium">
                                Step {currentStep + 1} of 5
                            </div>
                            <div className="flex gap-3">
                                {currentStep > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        className="h-11 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                )}

                                {currentStep < 4 && (
                                    <Button
                                        className="h-11 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all"
                                        onClick={() => setCurrentStep(prev => prev + 1)}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Message Modal */}
                <Dialog open={messageModal.isOpen} onOpenChange={(open) => setMessageModal(prev => ({ ...prev, isOpen: open }))}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className={messageModal.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                                {messageModal.title}
                            </DialogTitle>
                            <DialogDescription>
                                {messageModal.message}
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div >
        </div >
    )
}

export default function EditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <EditorContent />
        </Suspense>
    )
}
