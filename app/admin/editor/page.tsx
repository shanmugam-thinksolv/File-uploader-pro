"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Save, Link2, Copy, Check, ArrowLeft, ArrowRight, Loader2, Globe, Mail, QrCode, Code, Send } from "lucide-react"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { QRCodeCanvas } from "qrcode.react"
import { AccessTab } from './components/AccessTab';
import { TabTransition } from './components/TabTransition';
import { GeneralStep } from './components/steps/GeneralStep';
import { UploadsStep } from './components/steps/UploadsStep';
import { OrganizationStep } from './components/steps/OrganizationStep';
import { DesignStep } from './components/steps/DesignStep';
import { EditorFormData, UploadField, CustomQuestion } from './types';


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
    const [shortenLoading, setShortenLoading] = useState(false)

    const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    })

    // Email Invite State
    const [emailInviteSubject, setEmailInviteSubject] = useState("File Upload Request")
    const [emailInviteMessage, setEmailInviteMessage] = useState("Please upload your files using the link below.")

    // Auto-save
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const [formData, setFormData] = useState<EditorFormData>({
        id: "",
        title: "",
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
                    let uploadFields = typeof data.uploadFields === 'string' ? JSON.parse(data.uploadFields) : data.uploadFields || []
                    const customQuestions = typeof data.customQuestions === 'string' ? JSON.parse(data.customQuestions) : data.customQuestions || []

                    // Ensure uploadFields is an array
                    if (!Array.isArray(uploadFields)) {
                        uploadFields = []
                    }

                    // Convert "Untitled Form" to empty string (treat as placeholder)
                    const title = data.title === 'Untitled Form' ? '' : (data.title || '')

                    // Ensure expiryDate has proper time component if it exists
                    let expiryDate = data.expiryDate
                    if (expiryDate) {
                        // If expiryDate is a full ISO string, convert to datetime-local format
                        const date = new Date(expiryDate)
                        if (!isNaN(date.getTime())) {
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            const hours = String(date.getHours()).padStart(2, '0')
                            const minutes = String(date.getMinutes()).padStart(2, '0')
                            expiryDate = `${year}-${month}-${day}T${hours}:${minutes}`
                        }
                    }

                    setFormData(prev => ({
                        ...prev,
                        ...data,
                        title,
                        expiryDate,
                        uploadFields,
                        customQuestions
                    }))
                })
                .catch(err => console.error('Failed to load form', err))
        } else if (formId === 'new' || !formId) {
            // Initialize with one empty question and one empty upload field for new forms
            setFormData(prev => {
                // Only initialize if arrays are empty
                if (prev.uploadFields.length === 0 && prev.customQuestions.length === 0) {
                    const defaultUploadField: UploadField = {
                        id: crypto.randomUUID(),
                        label: "",
                        allowedTypes: "any",
                        required: true, // First field is required by default
                        allowMultiple: true,
                        allowFolder: false,
                    }
                    const defaultQuestion: CustomQuestion = {
                        id: crypto.randomUUID(),
                        type: "text",
                        label: "",
                        required: false,
                        options: []
                    }
                    return {
                        ...prev,
                        uploadFields: [defaultUploadField],
                        customQuestions: [defaultQuestion]
                    }
                }
                return prev
            })
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

    const handleSave = async (shouldPublish: boolean = false) => {
        setLoading(true)
        try {
            const method = formId && formId !== 'new' ? 'PUT' : 'POST'
            const url = formId && formId !== 'new' ? `/api/forms/${formId}` : '/api/forms'

            // If publishing, set isPublished to true
            const dataToSave = shouldPublish 
                ? { ...formData, isPublished: true }
                : formData

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave)
            })

            if (res.ok) {
                const data = await res.json()

                // Save to localStorage to track ownership/history
                try {
                    const savedIds = JSON.parse(localStorage.getItem('my_form_ids') || '[]')
                    if (!savedIds.includes(data.id)) {
                        savedIds.push(data.id)
                        localStorage.setItem('my_form_ids', JSON.stringify(savedIds))
                    }
                } catch (e) {
                    console.error('Failed to save to localStorage', e)
                }

                // Use router.refresh() to ensure dashboard refreshes
                router.refresh()
                router.push('/admin/dashboard')
            } else {
                const errorData = await res.json()
                showMessage('Error', errorData.error || errorData.details || 'Failed to save form', 'error')
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
            formDataObj.append('formTitle', formData.title || '')

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
            label: "",
            allowedTypes: "any",
            required: formData.uploadFields.length === 0, // First field is required by default, others are not
            allowMultiple: true, // Checked by default
            allowFolder: false, // Unchecked by default
        }
        updateField('uploadFields', [...formData.uploadFields, newField])
    }

    const removeUploadField = (id: string) => {
        updateField('uploadFields', formData.uploadFields.filter(f => f.id !== id))
    }

    const updateUploadFieldItem = (id: string, updates: Partial<UploadField>) => {
        setFormData(prev => ({
            ...prev,
            uploadFields: prev.uploadFields.map(f =>
                f.id === id ? { ...f, ...updates } : f
            )
        }))
    }

    const addCustomQuestion = () => {
        const newQuestion = {
            id: crypto.randomUUID(),
            type: "text",
            label: "",
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
            {/* Fixed Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="mx-auto px-6 py-4 max-w-[1600px]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-bold text-gray-900">{formData.title}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-purple-50 rounded-full border border-primary-100">
                                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-primary-700">
                                    {isSaving ? 'Auto-saving...' : 'All changes saved'}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => handleSave(false)}
                                disabled={loading}
                                className="h-10 px-6 font-medium border-gray-300 hover:border-primary-300 hover:bg-primary-50/50 transition-all shadow-sm hover:shadow-md"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Saving...' : 'Save Draft'}
                            </Button>
                            <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
                                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 border-0 shadow-2xl bg-white rounded-2xl">
                                    {/* Modern Header */}
                                    <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                                    <div className="p-2 bg-primary-50 rounded-lg">
                                                        <Globe className="w-6 h-6 text-primary-600" />
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
                                                    className="ml-2 data-[state=checked]:bg-primary-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8">
                                        <Tabs defaultValue="link" className="w-full">
                                            <TabsList className="w-full mb-6 grid grid-cols-3">
                                                <TabsTrigger value="link" className="data-[state=active]:text-primary-600">
                                                    <Link2 className="w-4 h-4 mr-2 text-primary-600" /> Link
                                                </TabsTrigger>
                                                <TabsTrigger value="email" className="data-[state=active]:text-primary-600">
                                                    <Mail className="w-4 h-4 mr-2 text-primary-600" /> Email
                                                </TabsTrigger>
                                                <TabsTrigger value="embed" className="data-[state=active]:text-primary-600">
                                                    <Code className="w-4 h-4 mr-2 text-primary-600" /> Embed
                                                </TabsTrigger>
                                            </TabsList>

                                            {/* Link Tab */}
                                            <TabsContent value="link" className="space-y-8">
                                                <div className="space-y-4">
                                                    <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Public Link</Label>
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1 group">
                                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                <Link2 className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                                                            </div>
                                                            <Input
                                                                readOnly
                                                                value={formId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${formId}` : 'Save form first'}
                                                                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-mono text-sm rounded-xl text-gray-600"
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
                                                        className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all text-left"
                                                    >
                                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                                                            {shortenLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">Shorten URL</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">Get a compact link</div>
                                                        </div>
                                                    </button>

                                                    <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                                                        <DialogTrigger asChild>
                                                            <button className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all text-left">
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
                                            </TabsContent>

                                            {/* Email Tab */}
                                            <TabsContent value="email" className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Subject Line</Label>
                                                        <Input
                                                            value={emailInviteSubject}
                                                            onChange={(e) => setEmailInviteSubject(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Message Body</Label>
                                                        <Textarea
                                                            value={emailInviteMessage}
                                                            onChange={(e) => setEmailInviteMessage(e.target.value)}
                                                            rows={4}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex items-start gap-2">
                                                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <p>
                                                        This will open your default email client with a pre-filled message containing the link to your form.
                                                    </p>
                                                </div>

                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 h-11"
                                                        onClick={() => {
                                                            const link = formId ? `${window.location.origin}/upload/${formId}` : 'Save form first'
                                                            const fullBody = `${emailInviteMessage}\n\n${link}`
                                                            navigator.clipboard.writeText(`Subject: ${emailInviteSubject}\n\n${fullBody}`)
                                                            showMessage('Copied', 'Email content copied to clipboard', 'success')
                                                        }}
                                                    >
                                                        <Copy className="w-4 h-4 mr-2" /> Copy Content
                                                    </Button>
                                                    <Button
                                                        className="flex-1 h-11 bg-primary-600 hover:bg-primary-700 text-white"
                                                        onClick={() => {
                                                            const link = formId ? `${window.location.origin}/upload/${formId}` : 'Save form first'
                                                            const fullBody = `${emailInviteMessage}\n\n${link}`
                                                            window.open(`mailto:?subject=${encodeURIComponent(emailInviteSubject)}&body=${encodeURIComponent(fullBody)}`)
                                                        }}
                                                    >
                                                        <Send className="w-4 h-4 mr-2" /> Open Email
                                                    </Button>
                                                </div>
                                            </TabsContent>

                                            {/* Embed Tab */}
                                            <TabsContent value="embed" className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Embed Code</Label>
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            Copy and paste this code into your website's HTML to display the upload form.
                                                        </p>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                <Code className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                            <Textarea
                                                                readOnly
                                                                value={formId ? `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${formId}" width="100%" height="800px" style="border:0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>` : 'Save form first'}
                                                                className="pl-12 pr-32 pb-12 min-h-[120px] bg-slate-900 border-slate-800 text-slate-100 font-mono text-xs rounded-xl focus:ring-primary-500/50 resize-none"
                                                            />
                                                            <div className="absolute bottom-3 right-3">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 bg-white text-primary-600 hover:bg-gray-100 font-medium"
                                                                    onClick={() => {
                                                                        const code = `<iframe src="${window.location.origin}/upload/${formId}" width="100%" height="800px" style="border:0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>`
                                                                        navigator.clipboard.writeText(code)
                                                                        showMessage('Copied', 'Embed code copied to clipboard', 'success')
                                                                    }}
                                                                >
                                                                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy Code
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>

                                        <div className="border-t border-gray-100"></div>

                                        {/* Access Control */}
                                        <div className="space-y-4">
                                            <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Who can respond?</Label>


                                            <div className="grid grid-cols-2 gap-4">
                                                <div
                                                    onClick={() => updateField('accessLevel', 'ANYONE')}
                                                    className={`cursor-pointer relative flex items-start p-4 rounded-xl border-2 transition-all ${formData.accessLevel === 'ANYONE'
                                                        ? 'border-primary-600 bg-primary-50/30'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${formData.accessLevel === 'ANYONE' ? 'border-primary-600' : 'border-gray-300'}`}>
                                                        {formData.accessLevel === 'ANYONE' && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="font-semibold text-gray-900">Public</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-normal">Anyone with the link can respond</div>
                                                    </div>
                                                </div>

                                                <div
                                                    onClick={() => updateField('accessLevel', 'INVITED')}
                                                    className={`cursor-pointer relative flex items-start p-4 rounded-xl border-2 transition-all ${formData.accessLevel === 'INVITED'
                                                        ? 'border-primary-600 bg-primary-50/30'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${formData.accessLevel === 'INVITED' ? 'border-primary-600' : 'border-gray-300'}`}>
                                                        {formData.accessLevel === 'INVITED' && <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="font-semibold text-gray-900">Restricted</div>
                                                        <div className="text-xs text-gray-500 mt-1 font-normal">Only invited people can respond</div>
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
                                            className="h-12 px-8 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200 transition-all hover:scale-[1.02]"
                                            onClick={() => handleSave(true)}
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
            </div>

            {/* Main Content Area */}
            <div className="mx-auto px-6 py-6 max-w-[1600px]">
                {/* Left-Right Layout: Steps on Left, Content on Right */}
                <div className="flex gap-6">
                    {/* Left Sidebar - Step Navigation */}
                    <div className="w-72 flex-shrink-0">
                        <nav className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-2 sticky top-24" aria-label="Steps">
                            {[
                                { name: 'Form Details', step: 0 },
                                { name: 'Files to Collect', step: 1 },
                                { name: 'Organization', step: 2 },
                                { name: 'Access Control', step: 3 },
                                { name: 'Appearance', step: 4 }
                            ].map((tab) => {
                                const isActive = currentStep === tab.step;
                                const isCompleted = currentStep > tab.step;

                                return (
                                    <button
                                        key={tab.name}
                                        onClick={() => setCurrentStep(tab.step)}
                                        className={`
                                                    w-full group relative flex items-center gap-3 py-3 px-4 rounded-lg
                                                    font-medium text-sm transition-all duration-200 text-left
                                                    ${isActive
                                                ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                                                : isCompleted
                                                    ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent'
                                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-2 border-transparent'
                                            }
                                                `}
                                    >
                                        {/* Step number/checkmark */}
                                        <span
                                            className={`
                                                        flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0
                                                        transition-colors duration-200
                                                        ${isActive
                                                    ? 'bg-primary-600 text-white'
                                                    : isCompleted
                                                        ? 'bg-gray-200 text-gray-600'
                                                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                                }
                                                    `}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                tab.step + 1
                                            )}
                                        </span>

                                        {/* Step label */}
                                        <span className="flex-1">{tab.name}</span>
                                    </button>
                                );
                            })}

                            {/* Progress indicator */}
                            {/* <div className="pt-4 mt-4 border-t border-gray-200">
                                        <div className="text-xs text-gray-500 mb-2">Step {currentStep + 1} of 5</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                                            />
                                        </div>
                                    </div> */}
                        </nav>
                    </div>

                    {/* Right Side - Content Area */}
                    <div className="flex-1 min-w-0 space-y-6 pb-24">
                        {/* Step 0: General Information */}
                        {currentStep === 0 && (
                            <GeneralStep
                                formData={formData}
                                updateField={updateField}
                                addCustomQuestion={addCustomQuestion}
                                removeCustomQuestion={removeCustomQuestion}
                                updateCustomQuestionItem={updateCustomQuestionItem}
                            />
                        )}

                        {/* Step 1: Upload Settings */}
                        {currentStep === 1 && (
                            <UploadsStep
                                formData={formData}
                                updateField={updateField}
                                addUploadField={addUploadField}
                                removeUploadField={removeUploadField}
                                updateUploadFieldItem={updateUploadFieldItem}
                            />
                        )}

                        {/* Step 2: Organization */}
                        {currentStep === 2 && (
                            <OrganizationStep
                                formData={formData}
                                updateField={updateField}
                            />
                        )}

                        {/* Step 3: Availability & Access */}
                        {currentStep === 3 && (
                            <TabTransition>
                                <AccessTab formData={formData} updateField={updateField} />
                            </TabTransition>
                        )}

                        {/* Step 4: Design */}
                        {currentStep === 4 && (
                            <DesignStep
                                formData={formData}
                                updateField={updateField}
                                handleLogoUpload={handleLogoUpload}
                                handleCoverUpload={handleCoverUpload}
                                removeLogo={removeLogo}
                                logoUploading={logoUploading}
                                coverUploading={coverUploading}
                                isDraggingLogo={isDraggingLogo}
                                isDraggingCover={isDraggingCover}
                            />
                        )}

                        {/* Bottom Navigation - Fixed at bottom */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                            <div className="mx-auto px-6 py-4 max-w-[1600px]">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500 font-medium">
                                        Step {currentStep + 1} of 5
                                    </div>
                                    <div className="flex gap-3">
                                        {currentStep === 0 ? (
                                            <div className="h-11 px-6 rounded-xl border-2 border-transparent" />
                                        ) : (
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentStep(prev => prev - 1)}
                                                className="h-11 px-6 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600 transition-all"
                                            >
                                                <ArrowLeft className="w-4 h-4 mr-2" />
                                                Back
                                            </Button>
                                        )}

                                        {currentStep < 4 ? (
                                            <Button
                                                className="h-11 px-8 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] transition-all"
                                                onClick={() => setCurrentStep(prev => prev + 1)}
                                            >
                                                Next
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="h-11 px-8 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] transition-all"
                                                onClick={() => setIsPublishOpen(true)}
                                            >
                                                <Globe className="w-4 h-4 mr-2" />
                                                Publish
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
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
        </div>
    )
}

export default function EditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <EditorContent />
        </Suspense>
    )
}
