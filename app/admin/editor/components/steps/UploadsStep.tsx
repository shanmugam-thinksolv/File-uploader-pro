"use client"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Plus, GripVertical, Trash2, File, Image, FileText, Info } from "lucide-react"
import { TabTransition } from '../TabTransition'
import { EditorFormData, UploadField } from '../../types'
import { DriveConnectionStatus } from '../DriveConnectionStatus'

interface UploadsStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
    addUploadField: () => void
    removeUploadField: (id: string) => void
    updateUploadFieldItem: (id: string, updates: Partial<UploadField>) => void
}

interface UploadFieldItemProps {
    field: UploadField
    index: number
    updateUploadFieldItem: (id: string, updates: Partial<UploadField>) => void
    removeUploadField: (id: string) => void
}

function UploadFieldItem({ field, index, updateUploadFieldItem, removeUploadField }: UploadFieldItemProps) {
    const [showTooltip, setShowTooltip] = useState(false)
    const [showDeleteTooltip, setShowDeleteTooltip] = useState(false)
    const [showMultipleError, setShowMultipleError] = useState(false)
    const deleteTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const multipleErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const tooltipAutoShowTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const isFolderUploadEnabled = field.allowFolder === true
    
    // Auto-focus on the first field when it's rendered
    useEffect(() => {
        if (index === 0 && inputRef.current) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                inputRef.current?.focus()
                // Move cursor to end of text without selecting
                if (inputRef.current) {
                    const length = inputRef.current.value.length
                    inputRef.current.setSelectionRange(length, length)
                }
            }, 100)
        }
    }, [index])

    // Function to hide tooltip
    const hideTooltip = () => {
        setShowTooltip(false)
        if (tooltipAutoShowTimeoutRef.current) {
            clearTimeout(tooltipAutoShowTimeoutRef.current)
            tooltipAutoShowTimeoutRef.current = null
        }
    }

    // Automatically show tooltip when folder upload is enabled
    useEffect(() => {
        if (isFolderUploadEnabled) {
            // Clear any existing timeout
            if (tooltipAutoShowTimeoutRef.current) {
                clearTimeout(tooltipAutoShowTimeoutRef.current)
            }
            // Show tooltip immediately when folder upload is enabled
            setShowTooltip(true)
            // Auto-hide after 5 seconds
            tooltipAutoShowTimeoutRef.current = setTimeout(() => {
                setShowTooltip(false)
            }, 5000)
        } else {
            // Hide tooltip when folder upload is disabled
            hideTooltip()
        }

        // Cleanup on unmount
        return () => {
            if (tooltipAutoShowTimeoutRef.current) {
                clearTimeout(tooltipAutoShowTimeoutRef.current)
            }
        }
    }, [isFolderUploadEnabled])

    // Hide tooltip on click anywhere
    useEffect(() => {
        if (showTooltip && isFolderUploadEnabled) {
            const handleClick = () => {
                hideTooltip()
            }
            // Add click listener to document
            document.addEventListener('click', handleClick)
            return () => {
                document.removeEventListener('click', handleClick)
            }
        }
    }, [showTooltip, isFolderUploadEnabled])

    return (
        <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100/30 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200">
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="text-slate-300 cursor-move hover:text-slate-500 p-1.5 rounded-lg hover:bg-white transition-colors">
                        <GripVertical className="w-5 h-5" />
                    </div>
                    <span className="text-md font-medium text-slate-500">Field {index + 1}</span>
                </div>
            </div>

            <div className="flex-1 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Field Name</Label>
                        <Input
                            ref={inputRef}
                            value={field.label}
                            onChange={(e) => updateUploadFieldItem(field.id, { label: e.target.value })}
                            placeholder="e.g., Resume"
                            className="w-full px-4 py-2.5 mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 h-5 mt-1">
                            <Label className="text-sm font-medium text-slate-700">File types allowed</Label>
                            {isFolderUploadEnabled && (
                                <Tooltip>
                                    <TooltipTrigger
                                        onMouseEnter={() => {
                                            setShowTooltip(true)
                                            // Clear auto-hide timeout when hovering
                                            if (tooltipAutoShowTimeoutRef.current) {
                                                clearTimeout(tooltipAutoShowTimeoutRef.current)
                                                tooltipAutoShowTimeoutRef.current = null
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            // Hide after a short delay when mouse leaves
                                            if (tooltipAutoShowTimeoutRef.current) {
                                                clearTimeout(tooltipAutoShowTimeoutRef.current)
                                            }
                                            tooltipAutoShowTimeoutRef.current = setTimeout(() => {
                                                setShowTooltip(false)
                                            }, 300)
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            hideTooltip()
                                        }}
                                        className="text-primary-600 hover:text-primary-700 transition-colors mt-1.5 cursor-pointer"
                                    >
                                        <Info className="w-4 h-4" />
                                    </TooltipTrigger>
                                    {showTooltip && (
                                        <TooltipContent
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                hideTooltip()
                                            }}
                                        >
                                            <p className="leading-relaxed">
                                                Folders may contain mixed file types, so file type restrictions may not apply.
                                            </p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            )}
                        </div>
                        <Select
                            value={field.allowedTypes}
                            onValueChange={(val) => updateUploadFieldItem(field.id, { allowedTypes: val })}
                            disabled={isFolderUploadEnabled}
                        >
                            <SelectTrigger className={`w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${isFolderUploadEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                                <SelectItem value="any">
                                    <div className="flex items-center gap-2">
                                        <File className="w-4 h-4 text-primary-600" />
                                        <span>Any file</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="images">
                                    <div className="flex items-center gap-2">
                                        <Image className="w-4 h-4 text-primary-600" />
                                        <span>Images only (jpg, jpeg, png, gif, webp)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="docs">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary-600" />
                                        <span>Documents (pdf, doc, docx, xls, xlsx, ppt, pptx, odt)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center space-x-2">
                            <input
                                id={`allow-multiple-${field.id}`}
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                                style={{ accentColor: 'var(--primary-600)' }}
                                checked={field.allowMultiple === true}
                                onChange={(e) => {
                                    if (isFolderUploadEnabled && !e.target.checked) {
                                        // Show error message when trying to disable while folder upload is enabled
                                        setShowMultipleError(true)
                                        if (multipleErrorTimeoutRef.current) {
                                            clearTimeout(multipleErrorTimeoutRef.current)
                                        }
                                        multipleErrorTimeoutRef.current = setTimeout(() => {
                                            setShowMultipleError(false)
                                        }, 6000)
                                        // Prevent unchecking
                                        e.preventDefault()
                                        return
                                    }
                                    updateUploadFieldItem(field.id, { allowMultiple: e.target.checked })
                                }}
                            />
                            <label
                                htmlFor={`allow-multiple-${field.id}`}
                                className="text-sm font-normal text-slate-600 cursor-pointer select-none"
                            >
                                Allow multiple file uploads
                            </label>
                        </div>
                        {showMultipleError && (
                            <p className="text-xs text-slate-600 ml-6 mt-1 ">
                              Folder uploads include multiple files by default.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            id={`allow-folder-${field.id}`}
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 cursor-pointer"
                            style={{ accentColor: 'var(--primary-600)' }}
                            checked={field.allowFolder === true}
                            onChange={(e) => {
                                const updates: Partial<UploadField> = { allowFolder: e.target.checked }
                                if (e.target.checked) {
                                    if (field.allowedTypes !== 'any') {
                                        updates.allowedTypes = 'any'
                                    }
                                    if (!field.allowMultiple) {
                                        updates.allowMultiple = true
                                        // Show message when auto-enabling multiple file uploads
                                        setShowMultipleError(true)
                                        if (multipleErrorTimeoutRef.current) {
                                            clearTimeout(multipleErrorTimeoutRef.current)
                                        }
                                        multipleErrorTimeoutRef.current = setTimeout(() => {
                                            setShowMultipleError(false)
                                        }, 6000)
                                    }
                                }
                                updateUploadFieldItem(field.id, updates)
                            }}
                        />
                        <label
                            htmlFor={`allow-folder-${field.id}`}
                            className="text-sm font-normal text-slate-600 cursor-pointer select-none"
                        >
                            Allow folder upload
                        </label>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={field.required}
                                onCheckedChange={(checked: boolean) => updateUploadFieldItem(field.id, { required: checked })}
                                className="data-[state=checked]:bg-primary-600"
                                id={`required-${field.id}`}
                            />
                            <Label htmlFor={`required-${field.id}`} className="text-sm font-normal text-slate-600 ml-[-5px]">
                                Required field
                            </Label>
                        </div>
                        <div className="h-6 w-px bg-slate-300"></div>
                        <Tooltip>
                            <div
                                onMouseEnter={() => {
                                    // Clear any existing timeout
                                    if (deleteTooltipTimeoutRef.current) {
                                        clearTimeout(deleteTooltipTimeoutRef.current)
                                    }
                                    // Set timeout to show tooltip after 2 seconds
                                    deleteTooltipTimeoutRef.current = setTimeout(() => {
                                        setShowDeleteTooltip(true)
                                    }, 500)
                                }}
                                onMouseLeave={() => {
                                    // Clear timeout if mouse leaves before 2 seconds
                                    if (deleteTooltipTimeoutRef.current) {
                                        clearTimeout(deleteTooltipTimeoutRef.current)
                                        deleteTooltipTimeoutRef.current = null
                                    }
                                    setShowDeleteTooltip(false)
                                }}
                                className="relative inline-block"
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                    onClick={() => removeUploadField(field.id)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                                {showDeleteTooltip && (
                                    <TooltipContent className="w-auto whitespace-nowrap">
                                        <p>Delete Field</p>
                                    </TooltipContent>
                                )}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function UploadsStep({ formData, updateField, addUploadField, removeUploadField, updateUploadFieldItem }: UploadsStepProps) {
    return (
        <TabTransition>
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-8">
                <div className="space-y-3">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Files to Collect</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">Decide what files people should upload and where those files will be saved.</p>
                </div>

                <div className="space-y-8">
                    {/* Google Drive Integration */}
                    <div className="space-y-5">
                        <DriveConnectionStatus formData={formData} updateField={updateField} />
                    </div>

                    {/* Multiple Upload Fields */}
                    <div className="border-t border-slate-200 pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900">What people can upload</h2>
                                <p className="text-sm text-slate-500 leading-relaxed">Add one or more file upload fields so people know exactly what to submit.</p>
                            </div>
                        </div>
                        <div className="space-y-5">
                            {formData.uploadFields.length === 0 ? (
                                <div className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
                                    <button
                                        onClick={addUploadField}
                                        disabled={formData.uploadFields.length >= 3}
                                        className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer group"
                                    >
                                        <Plus className="w-5 h-5 text-primary-600 transition-colors" />
                                    </button>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Add field</h3>
                                    <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
                                        Add at least one file upload field to collect files.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-5">
                                        {formData.uploadFields.map((field, index) => (
                                            <UploadFieldItem
                                                key={field.id}
                                                field={field}
                                                index={index}
                                                updateUploadFieldItem={updateUploadFieldItem}
                                                removeUploadField={removeUploadField}
                                            />
                                    ))}
                                    </div>
                                    {formData.uploadFields.length > 0 && (
                                        <div className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
                                            <button
                                                onClick={addUploadField}
                                                disabled={formData.uploadFields.length >= 3}
                                                className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus className="w-5 h-5 text-primary-600 transition-colors" />
                                            </button>
                                            <h3 className="text-sm font-semibold text-slate-900 mb-1">Add more fields..</h3>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TabTransition>
    )
}

