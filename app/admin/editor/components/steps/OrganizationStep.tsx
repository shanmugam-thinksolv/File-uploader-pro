 "use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { TabTransition } from '../TabTransition'
import { EditorFormData } from '../../types'

interface OrganizationStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
}

export function OrganizationStep({ formData, updateField }: OrganizationStepProps) {
    const updateFieldTyped = <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => {
        updateField(field, value)
    }

    const subfolderEnabled = formData.subfolderOrganization !== "NONE"

    return (
        <TabTransition>
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Track Response</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">Choose where uploads are saved and how they are listed.</p>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium text-slate-900">Create a response sheet</Label>
                            <p className="text-sm text-slate-500 font-normal mt-2">Save all uploads in Google Sheets for easy tracking.</p>
                        </div>
                        <Switch
                            checked={formData.enableMetadataSpreadsheet}
                            onCheckedChange={(c) => updateFieldTyped('enableMetadataSpreadsheet', c)}
                            className="data-[state=checked]:bg-primary-600"
                        />
                    </div>

                    <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium text-slate-900">Subfolder Organization</Label>
                                <p className="text-sm text-slate-500 font-normal">Create subfolders for uploads</p>
                            </div>
                            <Switch
                                checked={subfolderEnabled}
                                onCheckedChange={(c) => updateFieldTyped('subfolderOrganization', c ? "DATE" : "NONE")}
                                className="data-[state=checked]:bg-primary-600"
                            />
                        </div>

                        {subfolderEnabled && (
                            <div className="space-y-4 pl-6 border-l-2 border-primary-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-slate-700">Subfolder Name Pattern</Label>
                                    <Input
                                        value={formData.customSubfolderField ?? "{Date} {Uploader Name}"}
                                        onChange={(e) => updateFieldTyped('customSubfolderField', e.target.value)}
                                        className="font-mono text-sm w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
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
                                                    className={`h-auto px-3 py-1.5 text-xs rounded-lg font-medium transition-all shadow-sm ${isSelected
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
                    </div>
                </div>
            </div>
        </TabTransition>
    )
}

