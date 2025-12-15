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
                        className="data-[state=checked]:bg-indigo-600"
                    />
                </div>

                {formData.expiryDate && (
                    <div className="pl-6 border-l-2 border-indigo-100 flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <Input
                                type="datetime-local"
                                value={formData.expiryDate.slice(0, 16)}
                                onChange={(e) => updateField('expiryDate', e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                )}

                {/* Access Level Section */}
                <div className="space-y-5 pt-2">
                    <Label className="text-sm font-medium text-slate-900">Who can respond?</Label>
                    <RadioGroup
                        value={formData.accessLevel}
                        onValueChange={(val) => updateField('accessLevel', val as "ANYONE" | "INVITED")}
                        className="grid grid-cols-2 gap-5"
                    >
                        <div onClick={() => updateField('accessLevel', 'ANYONE')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessLevel === 'ANYONE' ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="ANYONE" id="anyone" className="mt-1 text-indigo-600 border-slate-300" />
                            <div className="space-y-1.5">
                                <Label htmlFor="anyone" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                    Public
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Anyone with the link can access</p>
                            </div>
                        </div>
                        <div onClick={() => updateField('accessLevel', 'INVITED')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessLevel === 'INVITED' ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="INVITED" id="invited" className="mt-1 text-indigo-600 border-slate-300" />
                            <div className="space-y-1.5">
                                <Label htmlFor="invited" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                    Restricted
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Only invited people can access</p>
                            </div>
                        </div>
                    </RadioGroup>

                    {formData.accessLevel === 'INVITED' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                            <Label className="text-sm font-medium text-slate-700">Email Invitations</Label>
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Enter email addresses (comma separated)"
                                    value={formData.allowedEmails}
                                    onChange={(e) => updateField('allowedEmails', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                />
                                <Button size="icon" variant="outline" className="h-[50px] w-[50px] rounded-xl border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <Mail className="w-5 h-5" />
                                </Button>
                            </div>
                            <p className="text-xs text-slate-400">Only these email addresses will be able to access the form.</p>
                        </div>
                    )}
                </div>

                {/* Access Protection Section */}
                <div className="space-y-5 pt-4 border-t border-slate-100">
                    <Label className="text-sm font-medium text-slate-900">Access Protection</Label>
                    <RadioGroup
                        value={formData.accessProtectionType || "PUBLIC"}
                        onValueChange={(val) => updateField('accessProtectionType', val as "PUBLIC" | "PASSWORD" | "GOOGLE")}
                        className="grid grid-cols-1 gap-4"
                    >
                        {/* Public Option */}
                        <div onClick={() => updateField('accessProtectionType', 'PUBLIC')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'PUBLIC' ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="PUBLIC" id="ap_public" className="mt-1 text-indigo-600 border-slate-300" />
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
                                                <SelectTrigger className="h-8 w-[120px] text-xs border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
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
                        <div onClick={() => updateField('accessProtectionType', 'PASSWORD')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'PASSWORD' ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="PASSWORD" id="ap_password" className="mt-1 text-indigo-600 border-slate-300" />
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
                                                className="h-10 border-slate-200 rounded-lg px-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border border-slate-100">
                                            <Label className="text-xs font-medium text-slate-600">Collect Email Addresses</Label>
                                            <Select
                                                value={formData.emailFieldControl || "OPTIONAL"}
                                                onValueChange={(val) => updateField('emailFieldControl', val as "REQUIRED" | "OPTIONAL" | "NOT_INCLUDED")}
                                            >
                                                <SelectTrigger className="h-8 w-[120px] text-xs border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
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
                        <div onClick={() => updateField('accessProtectionType', 'GOOGLE')} className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.accessProtectionType === 'GOOGLE' ? 'border-indigo-600 bg-indigo-50/30 shadow-sm' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="GOOGLE" id="ap_google" className="mt-1 text-indigo-600 border-slate-300" />
                            <div className="space-y-1.5 flex-1">
                                <Label htmlFor="ap_google" className="font-semibold text-slate-900 cursor-pointer flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                                    Require Google Sign-In
                                </Label>
                                <p className="text-xs text-slate-500 leading-relaxed">Users must sign in with Google to access</p>

                                {formData.accessProtectionType === 'GOOGLE' && (
                                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 pl-1">
                                        <div className="p-4 bg-indigo-50/50 text-indigo-700 rounded-xl border border-indigo-100 flex items-start gap-3">
                                            <Users className="w-5 h-5 mt-0.5 shrink-0 text-indigo-600" />
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
                                                className="h-10 border-slate-200 rounded-lg px-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
