"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { GooglePickerFolderSelect } from './GooglePickerFolderSelect'
import { EditorFormData } from '../types'

interface DriveConnectionStatusProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
}

export function DriveConnectionStatus({ formData, updateField }: DriveConnectionStatusProps) {
    const { data: session, status } = useSession()
    const loading = status === "loading"
    const isConnected = !!session

    if (loading) return <div className="h-20 animate-pulse bg-gray-100 rounded-xl"></div>

    if (!isConnected) {
        return (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-amber-900">Google Drive needs to be connected</h4>
                        <p className="text-xs text-amber-700">
                            Uploads are saved to your Google Drive. You must connect your account to continue.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    onClick={() => window.location.href = '/api/auth/signin/google'}
                >
                    Connect Google Drive
                </Button>
            </div>
        )
    }

    return (
        <div className=" p-4 border border-primary-100 rounded-xl bg-primary-50/30 animate-in fade-in slide-in-from-top-2">
            <GooglePickerFolderSelect formData={formData} updateField={updateField} />
        </div>
    )
}

