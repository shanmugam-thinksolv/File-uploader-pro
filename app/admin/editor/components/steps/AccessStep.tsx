import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Mail, Calendar, Users, Globe, Lock, ShieldCheck, FileSpreadsheet, Info, Check } from "lucide-react";
import { EditorFormData } from "../../types";

interface AccessTabProps {
    formData: EditorFormData;
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void;
    addCustomQuestion?: () => void;
}

export function AccessTab({ formData, updateField, addCustomQuestion }: AccessTabProps) {
    const [isExpiryTooltipOpen, setIsExpiryTooltipOpen] = useState(false)
    const [isEmailTooltipOpen, setIsEmailTooltipOpen] = useState<string | null>(null)
    const [isAllowedDomainsTooltipOpen, setIsAllowedDomainsTooltipOpen] = useState(false)
    const [pendingPassword, setPendingPassword] = useState<string | null>(null)
    const [pendingAllowedDomains, setPendingAllowedDomains] = useState<string | null>(null)
    const [passwordSaved, setPasswordSaved] = useState(false)
    const [allowedDomainsSaved, setAllowedDomainsSaved] = useState(false)
    const dateInputRef = useRef<HTMLInputElement>(null)
    const prevAccessTypeRef = useRef<string | undefined>(formData.accessProtectionType)
    
    // Reset pending values when switching access protection type
    useEffect(() => {
        if (formData.accessProtectionType !== 'PASSWORD') {
            setPendingPassword(null)
            setPasswordSaved(false)
        }
        if (formData.accessProtectionType !== 'GOOGLE') {
            setPendingAllowedDomains(null)
            setAllowedDomainsSaved(false)
        }
    }, [formData.accessProtectionType])
    
    // Remove Email question when Google Sign-In is enabled (email is collected automatically)
    useEffect(() => {
        // Only run when switching TO Google Sign-In (not when already on Google)
        if (formData.accessProtectionType === 'GOOGLE' && prevAccessTypeRef.current !== 'GOOGLE') {
            const questions = formData.customQuestions || []
            const emailQuestionIndex = questions.findIndex(
                q => q.label?.toLowerCase().trim() === "email"
            )
            
            if (emailQuestionIndex !== -1) {
                // Check if Email question is at position 0 (likely replaced an empty question)
                if (emailQuestionIndex === 0) {
                    // Restore an empty question at position 0
                    const updatedQuestions = [...questions]
                    updatedQuestions[0] = {
                        id: crypto.randomUUID(),
                        type: "text",
                        label: "",
                        required: false,
                        options: []
                    }
                    updateField('customQuestions', updatedQuestions)
                } else {
                    // Email question is not at position 0, just remove it
                    const updatedQuestions = questions.filter(
                        q => q.label?.toLowerCase().trim() !== "email"
                    )
                    updateField('customQuestions', updatedQuestions)
                }
                
                // Also reset emailFieldControl since Google Sign-In handles email automatically
                if (formData.emailFieldControl !== 'NOT_INCLUDED') {
                    updateField('emailFieldControl', 'NOT_INCLUDED')
                }
            }
        }
        
        // Update ref to track current access type
        prevAccessTypeRef.current = formData.accessProtectionType
    }, [formData.accessProtectionType, formData.customQuestions, formData.emailFieldControl, updateField])
    
    const handleEmailFieldControlChange = (val: "REQUIRED" | "OPTIONAL" | "NOT_INCLUDED") => {
        updateField('emailFieldControl', val)
        
        // If REQUIRED or OPTIONAL is selected, automatically create Email question if it doesn't exist
        if (val === "REQUIRED" || val === "OPTIONAL") {
            const questions = formData.customQuestions || []
            const hasEmailQuestion = questions.some(
                q => q.label?.toLowerCase().trim() === "email"
            )
            
            if (!hasEmailQuestion) {
                const emailQuestion = {
                    id: crypto.randomUUID(),
                    type: "text",
                    label: "Email",
                    required: val === "REQUIRED", // true for REQUIRED, false for OPTIONAL
                    options: []
                }
                
                // Check if first question has empty label
                const firstQuestion = questions[0]
                if (firstQuestion && (!firstQuestion.label || firstQuestion.label.trim() === "")) {
                    // Replace first question with Email
                    const updatedQuestions = [...questions]
                    updatedQuestions[0] = emailQuestion
                    updateField('customQuestions', updatedQuestions)
                } else {
                    // Check if there are questions with filled labels
                    const hasQuestionsWithLabels = questions.some(q => q.label && q.label.trim() !== "")
                    
                    if (hasQuestionsWithLabels) {
                        // Add Email as second question (after first)
                        const updatedQuestions = [...questions]
                        updatedQuestions.splice(1, 0, emailQuestion)
                        updateField('customQuestions', updatedQuestions)
                    } else {
                        // No questions with labels, add Email as first question
                        updateField('customQuestions', [emailQuestion, ...questions])
                    }
                }
            } else {
                // If Email question already exists, update its required status
                const updatedQuestions = questions.map(q => 
                    q.label?.toLowerCase().trim() === "email" 
                        ? { ...q, required: val === "REQUIRED" }
                        : q
                )
                updateField('customQuestions', updatedQuestions)
            }
        }
    }
    
    return (
        <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Availability & Access</h2>
                <p className="text-sm text-slate-500 leading-relaxed">Control when and who can access your form</p>
            </div>

                    <div className="space-y-8">
                {/* Set Form Expiry Section - Always Visible */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-slate-900">Set Form Expiry</Label>
                            <Tooltip>
                                <TooltipTrigger 
                                    className="mt-1 text-primary-600 hover:text-primary-700 transition-colors cursor-help relative z-10"
                                    onMouseEnter={() => setIsExpiryTooltipOpen(true)}
                                    onMouseLeave={() => setIsExpiryTooltipOpen(false)}
                                >
                                    <Info className="w-4 h-4" />
                                </TooltipTrigger>
                                {isExpiryTooltipOpen && (
                                    <TooltipContent className="max-w-xs z-[110]">
                                        <p className="leading-relaxed text-xs">
                                            When enabled, the form will automatically stop accepting new submissions after a selected date.
                                        </p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                        <p className="text-sm text-slate-500 font-normal mt-1">Automatically stop accepting submissions after a selected date.</p>
                    </div>
                        <Switch
                            checked={!!formData.expiryDate}
                            onCheckedChange={(c) => {
                                if (c) {
                                    // Set to current date and time
                                    const now = new Date()
                                    const year = now.getFullYear()
                                    const month = String(now.getMonth() + 1).padStart(2, '0')
                                    const day = String(now.getDate()).padStart(2, '0')
                                    const hours = String(now.getHours()).padStart(2, '0')
                                    const minutes = String(now.getMinutes()).padStart(2, '0')
                                    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`
                                    updateField('expiryDate', dateTimeString)
                                } else {
                                    updateField('expiryDate', null)
                                }
                            }}
                            className="data-[state=checked]:bg-primary-600"
                        />
                </div>

                {formData.expiryDate && (
                   <div className="pl-6 border-l-2 border-primary-100 flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
                        
                        <div 
                            className="flex items-center gap-2 w-full sm:w-auto cursor-pointer hover:bg-primary-50/50 p-2 rounded-lg transition-colors"
                            onClick={() => dateInputRef.current?.showPicker()}
                        >                                       
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <Input
                                ref={dateInputRef}
                                type="datetime-local"
                                value={formData.expiryDate.slice(0, 16)}
                                min={(() => {
                                    // Set minimum to current date and time
                                    const now = new Date()
                                    const year = now.getFullYear()
                                    const month = String(now.getMonth() + 1).padStart(2, '0')
                                    const day = String(now.getDate()).padStart(2, '0')
                                    const hours = String(now.getHours()).padStart(2, '0')
                                    const minutes = String(now.getMinutes()).padStart(2, '0')
                                    return `${year}-${month}-${day}T${hours}:${minutes}`
                                })()}
                                onChange={(e) => {
                                    const selectedValue = e.target.value
                                    if (selectedValue) {
                                        // Use the selected date and time as-is
                                        updateField('expiryDate', selectedValue)
                                    } else {
                                        updateField('expiryDate', null)
                                    }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Open the calendar picker when clicking anywhere in the input
                                    // Use the event target directly to ensure user gesture context
                                    const input = e.currentTarget as HTMLInputElement
                                    if (input && typeof input.showPicker === 'function') {
                                        try {
                                            input.showPicker()
                                        } catch (error) {
                                            // If showPicker fails, the native picker will still work
                                            console.log('showPicker error:', error)
                                        }
                                    }
                                }}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {/* Access Protection Section */}
                <div className="space-y-5 pt-4 border-t border-slate-100">
                    <Label className="text-sm font-medium text-slate-900">Access Protection</Label>
                    <RadioGroup
                        value={formData.accessProtectionType || "PUBLIC"}
                        onValueChange={(val) => {
                            const type = val as "PUBLIC" | "PASSWORD" | "GOOGLE";
                            updateField('accessProtectionType', type);
                            
                            // Keep database fields in sync
                            if (type === 'GOOGLE') {
                                updateField('accessLevel', 'INVITED');
                                updateField('isPasswordProtected', false);
                            } else if (type === 'PASSWORD') {
                                updateField('accessLevel', 'ANYONE');
                                updateField('isPasswordProtected', true);
                            } else {
                                updateField('accessLevel', 'ANYONE');
                                updateField('isPasswordProtected', false);
                            }
                        }}
                        className="grid grid-cols-1 gap-4 mt-2"
                    >
                        {/* Public Option */}
                        <div onClick={() => {
                            updateField('accessProtectionType', 'PUBLIC');
                            updateField('accessLevel', 'ANYONE');
                            updateField('isPasswordProtected', false);
                        }} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'PUBLIC' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="PUBLIC" id="ap_public" className="mt-1 text-primary-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_public" className="font-semibold text-slate-900 text-sm cursor-pointer flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                    Anyone with the link
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Anyone can access the form immediately</p>

                                {formData.accessProtectionType === 'PUBLIC' && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-1 pl-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-medium text-slate-600">Collect Email Addresses</Label>
                                                <Tooltip>
                                                    <TooltipTrigger 
                                                        className="text-primary-600 mt-1.5 hover:text-primary-700 transition-colors cursor-help relative z-10"
                                                        onMouseEnter={() => setIsEmailTooltipOpen('public')}
                                                        onMouseLeave={() => setIsEmailTooltipOpen(null)}
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </TooltipTrigger>
                                                    {isEmailTooltipOpen === 'public' && (
                                                        <TooltipContent className="max-w-xs z-[110]">
                                                            <p className="leading-relaxed text-xs">
                                                            Choosing Required or Optional will add an email field to your form.
                                                            Required means users must enter an email, Optional means they can skip it.
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </div>
                                            <Select
                                                value={formData.emailFieldControl || "NOT_INCLUDED"}
                                                onValueChange={handleEmailFieldControlChange}
                                            >
                                                <SelectTrigger className="h-8 w-full sm:w-[170px] text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200">
                                                    <SelectItem value="REQUIRED">Required</SelectItem>
                                                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                                                    <SelectItem value="NOT_INCLUDED">Don't ask for email</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Password Option */}
                        <div onClick={() => {
                            updateField('accessProtectionType', 'PASSWORD');
                            updateField('isPasswordProtected', true);
                            updateField('accessLevel', 'ANYONE');
                        }} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'PASSWORD' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="PASSWORD" id="ap_password" className="mt-1 text-primary-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_password" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    Protected
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Require a password to access the form</p>

                                {formData.accessProtectionType === 'PASSWORD' && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 pl-1">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-slate-600">Set Password :</Label>
                                            <div className="relative mt-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Enter your password..."
                                                    value={pendingPassword !== null ? pendingPassword : (formData.password || "")}
                                                    onChange={(e) => {
                                                        setPendingPassword(e.target.value)
                                                        setPasswordSaved(false) // Reset saved state when typing
                                                    }}
                                                    className="h-10 w-full border-slate-200 rounded-lg px-3 pr-24 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                {(pendingPassword !== null || passwordSaved) && (
                                                    <Button
                                                        onClick={() => {
                                                            updateField('password', pendingPassword || formData.password || "")
                                                            setPasswordSaved(true)
                                                            setPendingPassword(null)
                                                            // Hide button after 1.5 seconds
                                                            setTimeout(() => {
                                                                setPasswordSaved(false)
                                                            }, 1500)
                                                        }}
                                                        className="absolute right-1.5 top-1.5 h-7 px-2.5 py-1 text-xs rounded-md font-semibold transition-all shadow-sm bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> {passwordSaved ? "Saved" : "Save"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-medium text-slate-600">Collect Email Addresses</Label>
                                                <Tooltip>
                                                    <TooltipTrigger 
                                                        className="text-primary-600 mt-1.5 hover:text-primary-700 transition-colors cursor-help relative z-10"
                                                        onMouseEnter={() => setIsEmailTooltipOpen('password')}
                                                        onMouseLeave={() => setIsEmailTooltipOpen(null)}
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </TooltipTrigger>
                                                    {isEmailTooltipOpen === 'password' && (
                                                        <TooltipContent className="max-w-xs z-[110]">
                                                            <p className="leading-relaxed text-xs">
                                                            Choosing Required or Optional will add an email field to your form.
                                                            Required means users must enter an email, Optional means they can skip it.                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </div>
                                            <Select
                                                value={formData.emailFieldControl || "NOT_INCLUDED"}
                                                onValueChange={handleEmailFieldControlChange}
                                            >
                                                <SelectTrigger className="h-8 w-full sm:w-[170px] text-sm border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200">
                                                    <SelectItem value="REQUIRED">Required</SelectItem>
                                                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                                                    <SelectItem value="NOT_INCLUDED">Don't ask for email</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Google Sign-In Option */}
                        <div onClick={() => {
                            updateField('accessProtectionType', 'GOOGLE');
                            updateField('accessLevel', 'INVITED');
                            updateField('isPasswordProtected', false);
                        }} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'GOOGLE' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="GOOGLE" id="ap_google" className="mt-1 text-primary-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_google" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                                    Require Google Sign-In
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Users must sign in with Google to access the form</p>

                                        {formData.accessProtectionType === 'GOOGLE' && (
                                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 pl-1">
                                                <div className="p-4 bg-primary-50/50 text-primary-700 rounded-xl border border-primary-100 flex items-start gap-3">
                                                    <Users className="w-5 h-5 mt-0.5 shrink-0 text-primary-600" />
                                            <div>
                                                <span className="font-semibold block mb-1 text-sm">Verified Identity</span>
                                                <p className="text-xs leading-relaxed opacity-90">Email addresses will be automatically collected from the user's Google account.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs font-medium text-slate-600">Allowed Domains (Optional)</Label>
                                                <Tooltip>
                                                    <TooltipTrigger 
                                                        className="text-primary-600 hover:text-primary-700 transition-colors mt-1.5 cursor-help relative z-10"
                                                        onMouseEnter={() => setIsAllowedDomainsTooltipOpen(true)}
                                                        onMouseLeave={() => setIsAllowedDomainsTooltipOpen(false)}
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                    </TooltipTrigger>
                                                    {isAllowedDomainsTooltipOpen && (
                                                        <TooltipContent className="max-w-xs z-[110]">
                                                            <p className="leading-relaxed text-xs">
                                                                Enter email domains (after @) that are allowed to access this form. Separate multiple domains with commas. For example: company.com, school.edu, organization.org. Leave empty to allow any Google account.
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </div>
                                            <div className="relative mt-2">
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. company.com, school.edu"
                                                    value={pendingAllowedDomains !== null ? pendingAllowedDomains : (formData.allowedDomains?.join(', ') || "")}
                                                    onChange={(e) => {
                                                        setPendingAllowedDomains(e.target.value)
                                                        setAllowedDomainsSaved(false) // Reset saved state when typing
                                                    }}
                                                    className="h-10 w-full border-slate-200 rounded-lg px-3 pr-24 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                {(pendingAllowedDomains !== null || allowedDomainsSaved) && (
                                                    <Button
                                                        onClick={() => {
                                                            const domains = (pendingAllowedDomains || formData.allowedDomains?.join(', ') || "").split(',').map(s => s.trim()).filter(Boolean)
                                                            updateField('allowedDomains', domains)
                                                            setAllowedDomainsSaved(true)
                                                            setPendingAllowedDomains(null)
                                                            // Hide button after 1.5 seconds
                                                            setTimeout(() => {
                                                                setAllowedDomainsSaved(false)
                                                            }, 1500)
                                                        }}
                                                        className="absolute right-1.5 top-1.5 h-7 px-2.5 py-1 text-xs rounded-md font-semibold transition-all shadow-sm bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> {allowedDomainsSaved ? "Saved" : "Save"}
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">Leave empty to allow any Google account.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            </div>
        </div>
    );
}
