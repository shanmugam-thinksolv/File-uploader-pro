"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Save, Upload, Link2, Copy, Check, ArrowLeft, ChevronRight, Loader2, Globe, Mail, QrCode } from "lucide-react"
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

export default function EditorPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const formId = searchParams.get("id")

    const [currentTab, setCurrentTab] = useState(searchParams.get("tab") || "configuration")
    const [isPublishOpen, setIsPublishOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const [logoUploading, setLogoUploading] = useState(false)
    const [showQrCode, setShowQrCode] = useState(false)
    const [shortenLoading, setShortenLoading] = useState(false)

    const [formData, setFormData] = useState({
        title: "New Form",
        description: "",
        allowedTypes: "any",
        maxSizeMB: 100,
        driveEnabled: false,
        isAcceptingResponses: true,
        expiryDate: null as string | null,
        enableMetadataSpreadsheet: false,
        subfolderOrganization: "NONE",
        customSubfolderField: "",
        enableSmartGrouping: false,
        logoUrl: "",
        primaryColor: "#4f46e5",
        backgroundColor: "#ffffff",
        fontFamily: "Inter",
        accessLevel: "ANYONE",
        allowedEmails: "",
    })

    const updateField = (field: string, value: string | number | boolean | null) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const switchTab = (tab: string) => {
        setCurrentTab(tab)
        const url = new URL(window.location.href)
        url.searchParams.set('tab', tab)
        window.history.pushState({}, '', url.toString())
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    useEffect(() => {
        if (formId && formId !== 'new') {
            fetch(`/api/forms/${formId}`)
                .then(res => res.json())
                .then(data => setFormData(prev => ({ ...prev, ...data })))
                .catch(err => console.error('Failed to load form', err))
        }
    }, [formId])

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
            alert('Failed to save form')
        } finally {
            setLoading(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLogoUploading(true)
        try {
            const formDataObj = new FormData()
            formDataObj.append('logo', file)

            const res = await fetch('/api/upload-logo', {
                method: 'POST',
                body: formDataObj
            })

            if (res.ok) {
                const data = await res.json()
                updateField('logoUrl', data.url)
            } else {
                alert('Logo upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            alert('Logo upload failed')
        } finally {
            setLogoUploading(false)
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

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Navigation & Title */}
                <div className="mb-8 space-y-4">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{formData.title}</h1>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center p-1 rounded-full bg-gray-100/80 border border-gray-200 shadow-inner">
                        <button
                            onClick={() => switchTab("configuration")}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${currentTab === "configuration"
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Configuration
                        </button>
                        <button
                            onClick={() => switchTab("design")}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${currentTab === "design"
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            Design
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className={`transition-all duration-500 ${currentTab === "configuration" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
                        <div className="space-y-6">
                            {/* Wizard Progress */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    {['General', 'Uploads', 'Organization', 'Access'].map((step, index) => (
                                        <div key={step} className={`flex flex-col items-center relative z-10 ${index <= currentStep ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${index <= currentStep ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>
                                                {index + 1}
                                            </div>
                                            <span className="text-xs mt-1 font-medium">{step}</span>
                                        </div>
                                    ))}
                                    {/* Progress Bar Background */}
                                    <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-0 hidden sm:block" style={{ top: '2.5rem' }}></div>
                                    {/* Active Progress Bar */}
                                    {/* Note: This simple progress bar is tricky with flex justify-between. Using a simpler approach for now or omitting the connecting line to avoid layout issues without precise calculations. */}
                                </div>
                            </div>

                            {/* Step 0: General Information */}
                            {currentStep === 0 && (
                                <Card className="border-t-4 border-t-indigo-600 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">General Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="title">Form Title</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => updateField('title', e.target.value)}
                                                className="text-sm border-gray-200 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="description">Description</Label>
                                            <textarea
                                                id="description"
                                                className="flex min-h-[100px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                placeholder="Enter a description for your upload form..."
                                                value={formData.description || ''}
                                                onChange={(e) => updateField('description', e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground text-right">{formData.description?.length || 0}/1000 characters</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Step 1: Upload Settings */}
                            {currentStep === 1 && (
                                <Card className="shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Upload Settings</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-8">
                                        {/* Google Drive Integration - Premium UI */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-semibold text-gray-900">Google Drive Integration</Label>
                                                    <p className="text-sm text-muted-foreground">Save uploads directly to a Drive folder.</p>
                                                </div>
                                                <Switch
                                                    checked={formData.driveEnabled}
                                                    onCheckedChange={(c) => updateField('driveEnabled', c)}
                                                    className="data-[state=checked]:bg-indigo-600"
                                                />
                                            </div>

                                            {formData.driveEnabled && (
                                                <div className="mt-4 p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100">
                                                                {/* Drive Icon */}
                                                                <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l-13.65-23.65c-.5-1-.8-2.1-.8-3.15h27.9l-13.1 22.75c-2.85-1.65-5.2-4.1-6.6-6.95z" fill="#0066da" />
                                                                    <path d="m43.65 25-13.9-24.2c-.95-.5-2.1-.8-3.15-.8h-26.6c2.85 0 5.7.8 8.15 2.3l49.25 28.45z" fill="#00ac47" />
                                                                    <path d="m73.55 76.8c4.75-2.75 8.15-7.3 9.45-12.6l-14.5-25.1h-27.9l13.1 22.75c2.85 4.9 7.9 8.45 13.55 11.75z" fill="#ea4335" />
                                                                    <path d="m43.65 25 13.9-24.2c4.75 2.75 8.15 7.3 9.45 12.6l-13.65 23.65h-27.9z" fill="#00832d" />
                                                                    <path d="m59.9 53.2-16.25 28.45c-1.15.65-2.35 1.15-3.65 1.5l13.65-23.65c2.85-1.65 5.2-4.1 6.6-6.95z" fill="#2684fc" />
                                                                    <path d="m79.4 22.6c-1.3-5.3-4.7-9.85-9.45-12.6l-14.5 25.1 13.65 23.65c1.3-5.3 4.7-9.85 9.45-12.6z" fill="#ffba00" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{formData.title || "Untitled Form"}</div>
                                                                <div className="text-xs text-gray-500">Target Folder</div>
                                                            </div>
                                                        </div>
                                                        <a href="#" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                                                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-4 h-4 mr-2" />
                                                            View folder
                                                        </a>
                                                    </div>
                                                    <div className="mt-4">
                                                        <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200">
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Add File
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100"></div>

                                        <div className="space-y-3">
                                            <Label>Allowed File Types</Label>
                                            <Select
                                                value={formData.allowedTypes}
                                                onValueChange={(value) => updateField('allowedTypes', value)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select file types" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="any">Any file extension</SelectItem>
                                                    <SelectItem value="images">Images only</SelectItem>
                                                    <SelectItem value="docs">Documents only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Max Upload Size</Label>
                                            <Select
                                                value={formData.maxSizeMB.toString()}
                                                onValueChange={(value) => updateField('maxSizeMB', parseInt(value))}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select max size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10 MB</SelectItem>
                                                    <SelectItem value="100">100 MB</SelectItem>
                                                    <SelectItem value="1024">1 GB</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Step 2: Organization */}
                            {currentStep === 2 && (
                                <Card className="shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Organization</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Metadata Spreadsheet</Label>
                                                <p className="text-sm text-muted-foreground">Track upload details in a sheet.</p>
                                            </div>
                                            <Switch
                                                checked={formData.enableMetadataSpreadsheet}
                                                onCheckedChange={(c) => updateField('enableMetadataSpreadsheet', c)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>

                                        <div className="border-t border-gray-100"></div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Subfolder Organization</Label>
                                                <p className="text-sm text-muted-foreground">Create subfolders for uploads.</p>
                                            </div>
                                            <Switch
                                                checked={formData.subfolderOrganization !== "NONE"}
                                                onCheckedChange={(c) => updateField('subfolderOrganization', c ? "DATE" : "NONE")}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>

                                        {formData.subfolderOrganization !== "NONE" && (
                                            <div className="space-y-6 pl-4 border-l-2 border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm">Smart Grouping</Label>
                                                        <p className="text-sm text-muted-foreground">Group by matching names.</p>
                                                    </div>
                                                    <Switch
                                                        checked={formData.enableSmartGrouping}
                                                        onCheckedChange={(c) => updateField('enableSmartGrouping', c)}
                                                        className="data-[state=checked]:bg-indigo-600"
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <Label>Subfolder Name Pattern</Label>
                                                    <Input
                                                        value={formData.customSubfolderField || "{Date} {Uploader Name}"}
                                                        onChange={(e) => updateField('customSubfolderField', e.target.value)}
                                                        className="font-mono text-sm text-indigo-600"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Step 3: Availability & Access */}
                            {currentStep === 3 && (
                                <Card className="shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Availability & Access</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm">Accept Responses</Label>
                                                <p className="text-sm text-muted-foreground">Enable file uploads.</p>
                                            </div>
                                            <Switch
                                                checked={formData.isAcceptingResponses}
                                                onCheckedChange={(c) => updateField('isAcceptingResponses', c)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>

                                        {formData.isAcceptingResponses && (
                                            <>
                                                <div className="border-t border-gray-100"></div>
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-sm">Link Expiry</Label>
                                                        <p className="text-sm text-muted-foreground">Auto-close after date.</p>
                                                    </div>
                                                    <Switch
                                                        checked={!!formData.expiryDate}
                                                        onCheckedChange={(c) => updateField('expiryDate', c ? new Date().toISOString().slice(0, 16) : null)}
                                                        className="data-[state=checked]:bg-indigo-600"
                                                    />
                                                </div>
                                                {formData.expiryDate && (
                                                    <div className="pl-4 border-l-2 border-indigo-100 flex flex-wrap gap-3">
                                                        <Input
                                                            type="datetime-local"
                                                            value={formData.expiryDate.slice(0, 16)}
                                                            onChange={(e) => updateField('expiryDate', e.target.value)}
                                                            className="w-full sm:w-auto"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="border-t border-gray-100"></div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-medium text-gray-700">Who can respond?</Label>
                                            <RadioGroup
                                                value={formData.accessLevel}
                                                onValueChange={(val) => updateField('accessLevel', val)}
                                                className="grid grid-cols-2 gap-4"
                                            >
                                                <div className={`relative flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.accessLevel === 'ANYONE' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                    <RadioGroupItem value="ANYONE" id="anyone" className="mt-1" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="anyone" className="font-medium cursor-pointer">Public</Label>
                                                        <p className="text-xs text-muted-foreground">Anyone with the link</p>
                                                    </div>
                                                </div>
                                                <div className={`relative flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.accessLevel === 'INVITED' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                    <RadioGroupItem value="INVITED" id="invited" className="mt-1" />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="invited" className="font-medium cursor-pointer">Restricted</Label>
                                                        <p className="text-xs text-muted-foreground">Invited people only</p>
                                                    </div>
                                                </div>
                                            </RadioGroup>

                                            {formData.accessLevel === 'INVITED' && (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <Label className="text-sm font-medium text-gray-700">Email Invitations</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Enter email addresses (comma separated)"
                                                            value={formData.allowedEmails}
                                                            onChange={(e) => updateField('allowedEmails', e.target.value)}
                                                        />
                                                        <Button size="icon" variant="outline">
                                                            <Mail className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Only these email addresses will be able to access the form.</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Wizard Navigation */}
                            <div className="flex justify-between items-center pt-4">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleSave}
                                        disabled={loading}
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save Draft'}
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    {currentStep > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentStep(prev => prev - 1)}
                                        >
                                            Back
                                        </Button>
                                    )}

                                    {currentStep < 3 ? (
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                            onClick={() => switchTab("design")}
                                        >
                                            Go to Design
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`transition-all duration-500 ${currentTab === "design" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
                        <div className="space-y-6">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Visual Customization</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium text-gray-700">Form Logo</Label>
                                        {formData.logoUrl ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={formData.logoUrl} alt="Form logo" className="h-16 w-16 object-contain rounded" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">Logo uploaded</p>
                                                        <p className="text-xs text-gray-500">Displayed on public form</p>
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={removeLogo}>
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-6">
                                                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Input
                                                        id="logo-upload"
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                                        onChange={handleLogoUpload}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                                        disabled={logoUploading}
                                                    >
                                                        {logoUploading ? 'Uploading...' : 'Upload Logo'}
                                                    </Button>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG, or SVG (Max 2MB)</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-100"></div>

                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-sm">Primary Color</Label>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: formData.primaryColor }}></div>
                                                <Input
                                                    type="color"
                                                    value={formData.primaryColor}
                                                    onChange={(e) => updateField('primaryColor', e.target.value)}
                                                    className="w-full h-10 p-1 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-sm">Background Color</Label>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: formData.backgroundColor }}></div>
                                                <Input
                                                    type="color"
                                                    value={formData.backgroundColor}
                                                    onChange={(e) => updateField('backgroundColor', e.target.value)}
                                                    className="w-full h-10 p-1 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100"></div>

                                    <div className="space-y-4">
                                        <Label className="text-sm">Typography</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                { name: "Inter", style: " Sans-serif" },
                                                { name: "Roboto", style: "Classic" },
                                                { name: "Merriweather", style: "Serif" }
                                            ].map((font, i) => (
                                                <div
                                                    key={i}
                                                    className={`
                                                        flex flex-col p-3 rounded-lg border cursor-pointer transition-all
                                                        ${formData.fontFamily === font.name
                                                            ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                                            : "border-gray-200 hover:bg-gray-50"
                                                        }
                                                    `}
                                                    onClick={() => updateField('fontFamily', font.name)}
                                                >
                                                    <span className="font-semibold text-gray-900" style={{ fontFamily: font.name }}>Aa</span>
                                                    <span className="text-sm mt-1">{font.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between items-center">
                                <Button
                                    variant="outline"
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {loading ? 'Saving...' : 'Save Draft'}
                                </Button>

                                <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                                            Publish
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 border-0 shadow-2xl">
                                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                                            <DialogHeader className="text-white">
                                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                                    <Globe className="w-6 h-6" />
                                                    Publish & Share
                                                </DialogTitle>
                                                <DialogDescription className="text-indigo-100 text-base">
                                                    Make your form live and start collecting responses.
                                                </DialogDescription>
                                            </DialogHeader>
                                        </div>

                                        <div className="p-6 space-y-8 bg-white">
                                            {/* Status Section */}
                                            <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 transition-all hover:border-indigo-200 hover:shadow-sm">
                                                <div className="space-y-1">
                                                    <Label className="text-base font-semibold text-indigo-950">Accept Responses</Label>
                                                    <p className="text-sm text-indigo-600/80 font-medium">
                                                        {formData.isAcceptingResponses ? "Form is currently active" : "Form is paused"}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={formData.isAcceptingResponses}
                                                    onCheckedChange={(c) => updateField('isAcceptingResponses', c)}
                                                    className="data-[state=checked]:bg-indigo-600"
                                                />
                                            </div>

                                            {/* Link Section */}
                                            <div className="space-y-3">
                                                <Label className="text-sm font-medium text-gray-700">Public Link</Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1 group">
                                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                            <Link2 className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                                        </div>
                                                        <Input
                                                            readOnly
                                                            value={formId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${formId}` : 'Save form first'}
                                                            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all font-mono text-sm"
                                                        />
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={copyLink}
                                                        className="shrink-0 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                                    >
                                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div
                                                    className="group p-4 border border-gray-200 rounded-xl text-center space-y-3 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all duration-200"
                                                    onClick={handleShortenUrl}
                                                >
                                                    <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-200">
                                                        {shortenLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Link2 className="w-6 h-6" />}
                                                    </div>
                                                    <div className="font-medium text-gray-900">Shorten URL</div>
                                                </div>

                                                <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
                                                    <DialogTrigger asChild>
                                                        <div className="group p-4 border border-gray-200 rounded-xl text-center space-y-3 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all duration-200">
                                                            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-200">
                                                                <QrCode className="w-6 h-6" />
                                                            </div>
                                                            <div className="font-medium text-gray-900">QR Code</div>
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-sm flex flex-col items-center justify-center py-10">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-center">Scan to Upload</DialogTitle>
                                                            <DialogDescription className="text-center">
                                                                Scan this QR code to open the upload form on your mobile device.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
                                                            <QRCodeCanvas
                                                                value={formId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${formId}` : ''}
                                                                size={200}
                                                                level={"H"}
                                                                includeMargin={true}
                                                            />
                                                        </div>
                                                        <Button className="mt-6 w-full" onClick={() => window.print()}>
                                                            Print QR Code
                                                        </Button>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                                <Label className="text-sm font-medium text-gray-700">Who can respond?</Label>
                                                <RadioGroup
                                                    value={formData.accessLevel}
                                                    onValueChange={(val) => updateField('accessLevel', val)}
                                                    className="grid grid-cols-2 gap-4"
                                                >
                                                    <div className={`relative flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.accessLevel === 'ANYONE' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                        <RadioGroupItem value="ANYONE" id="anyone" className="mt-1" />
                                                        <div className="space-y-1">
                                                            <Label htmlFor="anyone" className="font-medium cursor-pointer">Public</Label>
                                                            <p className="text-xs text-muted-foreground">Anyone with the link</p>
                                                        </div>
                                                    </div>
                                                    <div className={`relative flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.accessLevel === 'INVITED' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                        <RadioGroupItem value="INVITED" id="invited" className="mt-1" />
                                                        <div className="space-y-1">
                                                            <Label htmlFor="invited" className="font-medium cursor-pointer">Restricted</Label>
                                                            <p className="text-xs text-muted-foreground">Invited people only</p>
                                                        </div>
                                                    </div>
                                                </RadioGroup>

                                                {formData.accessLevel === 'INVITED' && (
                                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                        <Label className="text-sm font-medium text-gray-700">Email Invitations</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="Enter email addresses (comma separated)"
                                                                value={formData.allowedEmails}
                                                                onChange={(e) => updateField('allowedEmails', e.target.value)}
                                                            />
                                                            <Button size="icon" variant="outline">
                                                                <Mail className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Only these email addresses will be able to access the form.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Publish Button */}
                                            <Button
                                                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 transition-all duration-200 hover:scale-[1.02]"
                                                onClick={handleSave}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        Publishing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Publish Form
                                                        <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
