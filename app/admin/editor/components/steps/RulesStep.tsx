"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Calendar, Table } from "lucide-react"
import { EditorFormData } from '../../types'
import { DriveConnectionStatus } from '../DriveConnectionStatus'

interface RulesStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
}

export function RulesStep({ 
    formData, 
    updateField
}: RulesStepProps) {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Google Drive Connection */}
            <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Google Drive Connection</Label>
                <div className=" bg-white ">
                    <DriveConnectionStatus formData={formData} updateField={updateField} />
                </div>
            </div>

            {/* Settings */}
            <div className="space-y-6">
                {/* Response Sheet */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Table className="w-5 h-5 text-gray-600" />
                        <div>
                            <Label className="text-sm font-medium text-gray-900 cursor-pointer">Create response sheet</Label>
                            <p className="text-xs text-gray-500 mt-0.5">Automatically create a Google Sheet for responses</p>
                        </div>
                    </div>
                    <Switch
                        checked={formData.enableResponseSheet}
                        onCheckedChange={(checked) => updateField('enableResponseSheet', checked)}
                    />
                </div>

                {/* Expiry Date */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            <div>
                                <Label className="text-sm font-medium text-gray-900 cursor-pointer">Set expiry date</Label>
                                <p className="text-xs text-gray-500 mt-0.5">Form will stop accepting responses after this date</p>
                            </div>
                        </div>
                        <Switch
                            checked={!!formData.expiryDate}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    const futureDate = new Date()
                                    futureDate.setMonth(futureDate.getMonth() + 1)
                                    updateField('expiryDate', futureDate.toISOString().slice(0, 16))
                                } else {
                                    updateField('expiryDate', null)
                                }
                            }}
                        />
                    </div>

                    {formData.expiryDate && (
                        <div className="pl-4 space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Expiry Date & Time</Label>
                            <Input
                                type="datetime-local"
                                value={formData.expiryDate || ''}
                                onChange={(e) => updateField('expiryDate', e.target.value)}
                                className="h-11"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
