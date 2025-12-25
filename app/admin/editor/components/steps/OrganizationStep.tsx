 "use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Plus, X, FileSpreadsheet, Info } from "lucide-react"
import { TabTransition } from '../TabTransition'
import { EditorFormData } from '../../types'

interface OrganizationStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
}

export function OrganizationStep({ formData, updateField }: OrganizationStepProps) {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false)
    
    const updateFieldTyped = <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => {
        updateField(field, value)
    }

    const subfolderEnabled = formData.subfolderOrganization !== "NONE"

    return (
        <TabTransition>
            <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-6 sm:space-y-8">
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Track Response</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">Choose where uploads are saved and how they are listed.</p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    {/* Response Sheet Section */}
                    <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-5 rounded-xl bg-gray-50 border border-gray-100 gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-semibold text-slate-900">Create Response Sheet</Label>
                                    <Tooltip>
                                        <TooltipTrigger 
                                            className="mt-1 text-primary-600 hover:text-primary-700 transition-colors cursor-help relative z-10"
                                            onMouseEnter={() => setIsTooltipOpen(true)}
                                            onMouseLeave={() => setIsTooltipOpen(false)}
                                        >
                                            <Info className="w-4 h-4" />
                                        </TooltipTrigger>
                                        {isTooltipOpen && (
                                            <TooltipContent className="max-w-xs z-[110]">
                                                <p className="leading-relaxed text-xs">
                                                    Automatically creates a Google Sheet linked to this form. Each submission creates one row with: Submission ID, timestamp, uploader details, file URLs, and all form responses. The sheet updates in real-time.
                                                </p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Live sync of all uploads to Google Sheets - no manual export needed.
                                </p>
                                {formData.enableResponseSheet && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                                        <p className="text-xs text-green-700 font-medium">
                                            ✓ Active: All uploads are being synced to Google Sheets
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Switch
                            checked={formData.enableResponseSheet || false}
                            onCheckedChange={(c) => updateFieldTyped('enableResponseSheet', c)}
                            className="data-[state=checked]:bg-primary-600 shrink-0 self-end sm:self-start"
                        />
                    </div>

                    {/* Temporarily commented out subfolder organization */}
                    {/* <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-slate-900">Subfolder Organization</Label>
                                <p className="text-xs sm:text-sm text-slate-500 font-normal">Create subfolders for uploads</p>
                            </div>
                            <Switch
                                checked={subfolderEnabled}
                                onCheckedChange={(c) => updateFieldTyped('subfolderOrganization', c ? "DATE" : "NONE")}
                                className="data-[state=checked]:bg-primary-600"
                            />
                        </div>

                        {subfolderEnabled && (
                            <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-primary-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-slate-700">Subfolder Name Pattern</Label>
                                    <Input
                                        value={formData.customSubfolderField ?? "{Date} {Uploader Name}"}
                                        onChange={(e) => updateFieldTyped('customSubfolderField', e.target.value)}
                                        className="font-mono text-xs sm:text-sm w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {['{Date}', '{Uploader Name}', '{Form Title}', '{Email}'].map((tag) => {
                                            const currentVal = formData.customSubfolderField ?? "{Date} {Uploader Name}"
                                            const isSelected = currentVal.includes(tag)

                                            return (
                                                <Button
                                                    key={tag}
                                                    variant="outline"
                                                    size="sm"
                                                    type="button"
                                                    className={`h-auto px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs rounded-lg font-medium transition-all shadow-sm ${isSelected
                                                        ? "bg-primary-50 text-primary-600 border-primary-200 hover:bg-primary-100 hover:border-primary-300"
                                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300"
                                                        }`}
                                                    onClick={() => {
                                                        const current = formData.customSubfolderField ?? "{Date} {Uploader Name}"
                                                        let newVal: string
                                                        if (isSelected) {
                                                            newVal = current.replace(tag, '').replace(/\s\s+/g, ' ').trim()
                                                        } else {
                                                            newVal = (current + ' ' + tag).trim()
                                                        }
                                                        updateFieldTyped('customSubfolderField', newVal)
                                                    }}
                                                >
                                                    {isSelected ? <X className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                                    {tag}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div> */}
                </div>
            </div>
        </TabTransition>
    )
}

