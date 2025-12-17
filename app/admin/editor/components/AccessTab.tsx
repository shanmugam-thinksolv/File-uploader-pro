import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Calendar, Users, Globe, Lock, ShieldCheck } from "lucide-react";
import { EditorFormData } from "../types";

interface AccessTabProps {
    formData: EditorFormData;
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void;
}

export function AccessTab({ formData, updateField }: AccessTabProps) {
    return (
        <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
            <div className="space-y-3">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Availability & Access</h2>
                <p className="text-sm text-slate-500 leading-relaxed">Control when and who can access your form</p>
            </div>

                    <div className="space-y-8">
                {/* Link Expiry Section - Always Visible */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="space-y-1">
                        <Label className="text-sm font-medium text-slate-900">Link Expiry</Label>
                        <p className="text-sm text-slate-500 font-normal">Auto-close form after date</p>
                    </div>
                        <Switch
                            checked={!!formData.expiryDate}
                            onCheckedChange={(c) => updateField('expiryDate', c ? new Date().toISOString().slice(0, 16) : null)}
                            className="data-[state=checked]:bg-primary-600"
                        />
                </div>

                {formData.expiryDate && (
                    <div className="pl-6 border-l-2 border-primary-100 flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <Input
                                type="datetime-local"
                                value={formData.expiryDate.slice(0, 16)}
                                onChange={(e) => updateField('expiryDate', e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                )}

                {/* Access Protection Section */}
                <div className="space-y-5 pt-4 border-t border-slate-100">
                    <Label className="text-sm font-medium text-slate-900">Access Protection</Label>
                    <RadioGroup
                        value={formData.accessProtectionType || "PUBLIC"}
                        onValueChange={(val) => updateField('accessProtectionType', val as "PUBLIC" | "PASSWORD" | "GOOGLE")}
                        className="grid grid-cols-1 gap-4"
                    >
                        {/* Public Option */}
                        <div onClick={() => updateField('accessProtectionType', 'PUBLIC')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'PUBLIC' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="PUBLIC" id="ap_public" className="mt-1 text-primary-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_public" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                    Public (No Verification)
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Anyone can access the form immediately</p>

                                {formData.accessProtectionType === 'PUBLIC' && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-1 pl-1">
                                        <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border border-slate-100">
                                            <Label className="text-xs font-medium text-slate-600">Collect Email Addresses</Label>
                                            <Select
                                                value={formData.emailFieldControl || "OPTIONAL"}
                                                onValueChange={(val) => updateField('emailFieldControl', val as "REQUIRED" | "OPTIONAL" | "NOT_INCLUDED")}
                                            >
                                                <SelectTrigger className="h-8 w-[120px] text-xs border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200">
                                                    <SelectItem value="REQUIRED">Required</SelectItem>
                                                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                                                    <SelectItem value="NOT_INCLUDED">Don't Ask</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Password Option */}
                        <div onClick={() => updateField('accessProtectionType', 'PASSWORD')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'PASSWORD' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="PASSWORD" id="ap_password" className="mt-1 text-primary-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_password" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    Password / Invite Code
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Require a password to view the form</p>

                                {formData.accessProtectionType === 'PASSWORD' && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 pl-1">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-slate-600">Set Password</Label>
                                            <Input
                                                type="text"
                                                placeholder="Enter password..."
                                                value={formData.password || ""}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                className="h-10 border-slate-200 rounded-lg px-3 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border border-slate-100">
                                            <Label className="text-xs font-medium text-slate-600">Collect Email Addresses</Label>
                                            <Select
                                                value={formData.emailFieldControl || "OPTIONAL"}
                                                onValueChange={(val) => updateField('emailFieldControl', val as "REQUIRED" | "OPTIONAL" | "NOT_INCLUDED")}
                                            >
                                                <SelectTrigger className="h-8 w-[120px] text-xs border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-lg border-slate-200">
                                                    <SelectItem value="REQUIRED">Required</SelectItem>
                                                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                                                    <SelectItem value="NOT_INCLUDED">Don't Ask</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Google Sign-In Option */}
                        <div onClick={() => updateField('accessProtectionType', 'GOOGLE')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'GOOGLE' ? 'border-primary-600 bg-primary-50/30 shadow-sm' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="GOOGLE" id="ap_google" className="mt-1 text-primary-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_google" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                                    Require Google Sign-In
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Users must sign in with Google to access</p>

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
                                            <Label className="text-xs font-medium text-slate-600">Allowed Domains (Optional)</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. company.com, school.edu"
                                                    value={formData.allowedDomains?.join(', ') || ""}
                                                    onChange={(e) => updateField('allowedDomains', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                    className="h-10 border-slate-200 rounded-lg px-3 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                            <p className="text-xs text-slate-400">Leave empty to allow any Google account.</p>
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
