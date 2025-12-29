"use client"

import { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Save, Check, Globe, Lock, ShieldCheck, Shield, Eye, EyeOff, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { EditorFormData } from '../../types'

interface AccessStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
    onSave?: () => Promise<void> | void
    onLogoUpload?: (file: File) => Promise<void>
    onLogoRemove?: () => void
    logoUploading?: boolean
}

export function AccessStep({ formData, updateField, onSave, onLogoUpload, onLogoRemove, logoUploading = false }: AccessStepProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSave = async () => {
        if (!onSave) return
        
        setIsSaving(true)
        setIsSaved(false)
        
        try {
            await onSave()
            setIsSaved(true)
            // Reset saved state after 2 seconds
            setTimeout(() => {
                setIsSaved(false)
            }, 2000)
        } catch (error) {
            console.error('Save failed:', error)
        } finally {
            setIsSaving(false)
        }
    }
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Access Control */}
            <div className="space-y-6">
                <Label className="text-sm text-base font-medium text-gray-700">Who can upload?</Label>
                
                <div className="space-y-4 mt-4">
                    {(() => {
                        const isSelected = formData.accessProtectionType === 'PUBLIC' && !formData.isPasswordProtected
                        return (
                            <label className={`flex items-center gap-4 p-5 border rounded-lg cursor-pointer transition-colors ${
                                isSelected 
                                    ? 'border-primary-500 bg-primary-50 shadow-sm' 
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
                            }`}>
                                <input
                                    type="radio"
                                    name="access"
                                    checked={isSelected}
                                    onChange={() => {
                                        updateField('accessProtectionType', 'PUBLIC')
                                        updateField('isPasswordProtected', false)
                                        updateField('accessLevel', 'ANYONE')
                                    }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-0 focus:ring-offset-0 accent-primary-600"
                                />
                                <Globe className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Anyone with the link</div>
                                    <div className="text-sm text-gray-500 mt-1">Public access</div>
                                </div>
                            </label>
                        )
                    })()}

                    {(() => {
                        const isSelected = formData.isPasswordProtected
                        return (
                            <label className={`flex items-center gap-4 p-5 border rounded-lg cursor-pointer transition-colors ${
                                isSelected 
                                    ? 'border-primary-500 bg-primary-50 shadow-sm' 
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
                            }`}>
                                <input
                                    type="radio"
                                    name="access"
                                    checked={isSelected}
                                    onChange={() => {
                                        updateField('isPasswordProtected', true)
                                        updateField('accessProtectionType', 'PASSWORD')
                                    }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-0 focus:ring-offset-0 accent-primary-600"
                                />
                                <Lock className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Password protected</div>
                                    <div className="text-sm text-gray-500 mt-1">Requires password to upload</div>
                                </div>
                            </label>
                        )
                    })()}

                    {formData.isPasswordProtected && (
                        <div className="pl-6 border-l-2 border-primary-200 ml-7 space-y-4 py-2">
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password || ''}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        placeholder="Enter password"
                                        className="h-10 flex-1 pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                                {onSave && formData.password && formData.password.trim().length > 0 && (
                                    <Button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="h-10 px-4 bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
                                    >
                                        {isSaved ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Saved
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {(() => {
                        const isSelected = formData.accessLevel === 'INVITED' && !formData.isPasswordProtected
                        return (
                            <label className={`flex items-center gap-4 p-5 border rounded-lg cursor-pointer transition-colors ${
                                isSelected 
                                    ? 'border-primary-500 bg-primary-50 shadow-sm' 
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'
                            }`}>
                                <input
                                    type="radio"
                                    name="access"
                                    checked={isSelected}
                                    onChange={() => {
                                        updateField('accessLevel', 'INVITED')
                                        updateField('accessProtectionType', 'GOOGLE')
                                        updateField('isPasswordProtected', false)
                                    }}
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-0 focus:ring-offset-0 accent-primary-600"
                                />
                                <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">Require Google Sign-In</div>
                                    <div className="text-sm text-gray-500 mt-1">Restricted to signed-in users</div>
                                </div>
                            </label>
                        )
                    })()}
                </div>
            </div>

            {/* Simple Design Options */}
            <div className="space-y-6">
                <Label className="text-sm  text-base font-medium text-gray-700">Appearance</Label>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500">Primary Color</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                className="h-10 w-20 p-1 border border-gray-200 rounded"
                            />
                            <Input
                                type="text"
                                value={formData.primaryColor}
                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                placeholder="#4f46e5"
                                className="h-10 flex-1"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs text-gray-500">Background</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="color"
                                value={formData.backgroundColor}
                                onChange={(e) => updateField('backgroundColor', e.target.value)}
                                className="h-10 w-20 p-1 border border-gray-200 rounded"
                            />
                            <Input
                                type="text"
                                value={formData.backgroundColor}
                                onChange={(e) => updateField('backgroundColor', e.target.value)}
                                placeholder="#ffffff"
                                className="h-10 flex-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-3 pt-4">
                    <Label className="text-xs text-gray-500">Form Logo</Label>
                    {formData.logoUrl ? (
                        <div className="relative border border-gray-200 rounded-lg p-5 bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <img
                                        src={formData.logoUrl}
                                        alt="Form logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">Logo uploaded</p>
                                    <p className="text-xs text-gray-500 mt-1">Click to replace or remove</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file && onLogoUpload) {
                                                onLogoUpload(file)
                                            }
                                            // Reset input so same file can be selected again
                                            if (e.target) {
                                                e.target.value = ''
                                            }
                                        }}
                                        disabled={logoUploading}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={logoUploading}
                                        className="h-9"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {logoUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Replace
                                            </>
                                        )}
                                    </Button>
                                    {onLogoRemove && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={onLogoRemove}
                                            disabled={logoUploading}
                                            className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <label className="block">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file && onLogoUpload) {
                                        onLogoUpload(file)
                                    }
                                }}
                                disabled={logoUploading}
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-50/30 transition-all cursor-pointer">
                                {logoUploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                                        <p className="text-sm text-gray-600">Uploading...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Upload Logo</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </label>
                    )}
                </div>
            </div>
        </div>
    )
}
