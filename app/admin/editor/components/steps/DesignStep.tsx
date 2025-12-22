"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, Eye } from "lucide-react"
import { TabTransition } from '../TabTransition'
import { EditorFormData } from '../../types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface DesignStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeLogo: () => void
    logoUploading: boolean
    coverUploading: boolean
    isDraggingLogo: boolean
    isDraggingCover: boolean
}

export function DesignStep({ 
    formData, 
    updateField, 
    handleLogoUpload, 
    handleCoverUpload, 
    removeLogo,
    logoUploading,
    coverUploading,
    isDraggingLogo,
    isDraggingCover
}: DesignStepProps) {
    const [showLivePreview, setShowLivePreview] = useState(false)

    return (
        <>
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
                                className="px-4 py-2 rounded-xl border-2 border-primary-100 bg-primary-50 text-primary-600 font-medium hover:bg-primary-100 hover:border-primary-200 transition-all shadow-sm"
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
                                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all ${isDraggingLogo ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'}`}>
                                                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
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
                                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all ${isDraggingCover ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'}`}>
                                                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
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
                                            className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm uppercase focus:ring-2 focus:ring-primary-500"
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
                                            className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm uppercase focus:ring-2 focus:ring-primary-500"
                                        />
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
                                <Eye className="w-5 h-5 text-primary-600" />
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
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                    disabled
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    placeholder="your.email@example.com"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
        </>
    )
}

