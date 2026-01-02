"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Calendar, Table } from "lucide-react"
import { EditorFormData } from '../../types'
import { DriveConnectionStatus } from '../DriveConnectionStatus'
import { MdAddToDrive } from "react-icons/md";
import { RiDriveLine } from "react-icons/ri";

interface RulesStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
}

export function RulesStep({ 
    formData, 
    updateField
}: RulesStepProps) {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Google Drive Connection */}
            <div className=" bg-white/85 backdrop-blur border border-primary-50 rounded-2xl p-5 shadow-sm">
                {/* <div className="flex items-center gap-3">
                    <div className=" text-primary-700">
                        <RiDriveLine className="w-6 h-6" />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold text-gray-800">Google Drive Connection</Label>
                        <p className="text-xs text-gray-500 mt-0.5">Link uploads to your Drive</p>
                    </div>
                </div> */}
                <DriveConnectionStatus formData={formData} updateField={updateField} />
            </div>

            {/* Settings */}
            <div className="space-y-4">
                {/* Response Sheet */}
                <div className="flex items-center justify-between p-5 bg-white/85 backdrop-blur border border-primary-50 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Table className="w-5 h-5 text-primary-600" />
                        <div>
                            <Label className="text-sm font-semibold text-gray-900 cursor-pointer">Create response sheet</Label>
                            <p className="text-xs text-gray-500 mt-0.5">Automatically create a Google Sheet for responses</p>
                        </div>
                    </div>
                    <Switch
                        checked={formData.enableResponseSheet}
                        onCheckedChange={(checked) => updateField('enableResponseSheet', checked)}
                        className="data-[state=checked]:bg-primary-600"
                    />
                </div>

                {/* Expiry Date */}
                <div className="space-y-4 p-5 bg-white/85 backdrop-blur border border-primary-50 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary-600" />
                            <div>
                                <Label className="text-sm font-semibold text-gray-900 cursor-pointer">Set expiry date</Label>
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
                            className="data-[state=checked]:bg-primary-600"
                        />
                    </div>

                    {formData.expiryDate && (
                        <div className="pl-4 space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Expiry Date & Time</Label>
                            <Input
                                type="datetime-local"
                                value={formData.expiryDate || ''}
                                onChange={(e) => updateField('expiryDate', e.target.value)}
                                className="h-11 border-primary-100 focus:border-primary-600 focus:ring-0 focus-visible:ring-0"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
