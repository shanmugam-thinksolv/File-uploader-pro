"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Plus, GripVertical, Trash2, Eye, ChevronRight, SquareCheckBig, Info, X } from "lucide-react"
import { TabTransition } from '../TabTransition'
import { BsTextParagraph } from "react-icons/bs";
import { MdOutlineArrowDropDownCircle, MdOutlineShortText } from "react-icons/md";
import { EditorFormData, CustomQuestion } from '../../types'

interface GeneralStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
    addCustomQuestion: () => void
    removeCustomQuestion: (id: string) => void
    updateCustomQuestionItem: <K extends keyof CustomQuestion>(id: string, key: K, value: CustomQuestion[K]) => void
}

function LivePreviewSection({ q }: { q: CustomQuestion }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="mt-2 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full text-left focus:outline-none group opacity-60 hover:opacity-100 transition-opacity"
            >
                <Eye className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex-1">Live Preview</span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} group-hover:text-primary-500`} />
            </button>

            {isOpen && (
                <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm select-none opacity-90 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            {q.label || 'Question Label'}
                            {q.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>

                        {q.type === 'text' && (
                            <div className="space-y-1 mt-2">
                                <Input
                                    placeholder={q.placeholder || "Type your placeholder here..."}
                                    className="bg-white"
                                    readOnly
                                />
                                {q.wordLimit && (
                                    <p className="text-xs text-gray-400 text-right">
                                        0/{q.wordLimit} words
                                    </p>
                                )}
                            </div>
                        )}

                        {q.type === 'textarea' && (
                            <div className="space-y-1 mt-2">
                                <Textarea
                                    placeholder={q.placeholder || "Type your placeholder here..."}
                                    className="bg-white resize-none"
                                    readOnly
                                />
                                {q.wordLimit && (
                                    <p className="text-xs text-gray-400 text-right">
                                        0/{q.wordLimit} words
                                    </p>
                                )}
                            </div>
                        )}

                        {q.type === 'select' && (
                            <Select >
                                <SelectTrigger className="bg-white mt-2">
                                    <SelectValue placeholder={q.placeholder || "Select an option"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(q.options && q.options.length > 0 ? q.options : ['Option 1', 'Option 2']).map((opt, i) => (
                                        <SelectItem key={i} value={opt || `option-${i + 1}`}>
                                            {opt || `Option ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(q.type === 'radio' || q.type === 'checkbox') && (
                            <div className="space-y-2 mt-2">
                                {(q.options && q.options.length > 0 ? q.options : ['Option 1', 'Option 2']).map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            type={q.type === 'radio' ? 'radio' : 'checkbox'}
                                            name={`preview-${q.id}`}
                                            className="text-primary-600"
                                            disabled
                                        />
                                        <Label className="text-sm text-gray-600 font-normal">
                                            {opt || `Option ${i + 1}`}
                                        </Label>
                                    </div>
                                ))}
                                {q.allowOther && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type={q.type === 'radio' ? 'radio' : 'checkbox'}
                                            name={`preview-${q.id}-other`}
                                            className="text-primary-600"
                                            disabled
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-sm text-gray-600 font-normal">Other :</span>
                                            <div className="border-b border-dashed border-gray-300 flex-1 mt-2" />
                                        </div>
                            </div>
                        )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function GeneralStep({ formData, updateField, addCustomQuestion, removeCustomQuestion, updateCustomQuestionItem }: GeneralStepProps) {
    const [draggedQuestionIndex, setDraggedQuestionIndex] = useState<number | null>(null)
    const [showTooltipForQuestion, setShowTooltipForQuestion] = useState<string | null>(null)
    const [showDeleteTooltipForQuestion, setShowDeleteTooltipForQuestion] = useState<string | null>(null)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const deleteTooltipTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
    const searchParams = useSearchParams()

    useEffect(() => {
        // Auto-focus on mount or when focusTitle parameter is present
        if (titleInputRef.current) {
            titleInputRef.current.focus()
            // Place cursor at the end of the text
            const length = titleInputRef.current.value.length
            titleInputRef.current.setSelectionRange(length, length)
        }
    }, [])

    // Focus title input when coming from validation error
    useEffect(() => {
        const focusTitle = searchParams.get('focusTitle')
        if (focusTitle === 'true' && titleInputRef.current) {
            // Small delay to ensure the component is fully rendered
            setTimeout(() => {
                titleInputRef.current?.focus()
                const length = titleInputRef.current?.value.length || 0
                titleInputRef.current?.setSelectionRange(length, length)
            }, 100)
        }
    }, [searchParams])

    const handleQuestionReorder = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return
        const updated = [...formData.customQuestions]
        const [moved] = updated.splice(fromIndex, 1)
        updated.splice(toIndex, 0, moved)
        updateField('customQuestions', updated as any)
    }

    const handleOptionReorder = (questionId: string, fromIndex: number, toIndex: number) => {
        const question = formData.customQuestions.find(q => q.id === questionId)
        if (!question || !question.options) return
        if (fromIndex === toIndex) return
        const updatedOptions = [...question.options]
        const [moved] = updatedOptions.splice(fromIndex, 1)
        updatedOptions.splice(toIndex, 0, moved)
        updateCustomQuestionItem(questionId, 'options', updatedOptions as any)
    }

    return (
        <TabTransition>
            <div className="bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-200 space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Form Details</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">Set up your form’s basic details.</p>
                </div>

                <div className="space-y-6">
                    {/* Title and Description side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-sm font-medium text-slate-700">Form Title</Label>
                            <Input
                                ref={titleInputRef}
                                id="title"
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 lg:mt-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                placeholder="Untitled Form"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                            <Textarea
                                id="description"
                                className="min-h-[100px] md:min-h-[120px] lg:mt-2 resize-y w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                placeholder="e.g., Instructions or details for people uploading files."
                                value={formData.description || ''}
                                onChange={(e) => updateField('description', e.target.value)}
                            />
                            <p className="text-xs text-slate-400 text-right">{formData.description?.length || 0}/1000 characters</p>
                        </div>
                    </div>
                </div>

                {/* Form Questions Section - Merged into General */}
                <div className="border-t border-slate-200 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Form Questions (Optional)</h2>
                            <p className="text-sm text-slate-400 leading-relaxed">
                             You can edit or delete this question, or continue without adding any content.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {formData.customQuestions.length === 0 ? (
                            <div className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
                                <button
                                    onClick={addCustomQuestion}
                                    className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer group"
                                >
                                    <Plus className="w-5 h-5 text-primary-600 transition-colors" />
                                </button>
                                <h3 className="text-sm font-semibold text-slate-900 mb-1">Add question</h3>
                                <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
                                    No questions added yet.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-5">{formData.customQuestions.map((q, index) => (
                                    <div
                                        key={q.id}
                                        className={`group relative bg-gradient-to-br from-slate-50 to-slate-100/30 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${draggedQuestionIndex === index ? 'border-primary-300 shadow-md' : 'border-slate-200 hover:border-primary-200'}`}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault()
                                            if (draggedQuestionIndex !== null && draggedQuestionIndex !== index) {
                                                handleQuestionReorder(draggedQuestionIndex, index)
                                            }
                                            setDraggedQuestionIndex(null)
                                        }}
                                    >
                                        {/* Header: Drag handle + question label */}
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="text-slate-300 cursor-move hover:text-slate-500 p-1.5 rounded-lg hover:bg-white transition-colors"
                                                    draggable
                                                    onDragStart={() => setDraggedQuestionIndex(index)}
                                                    onDragEnd={() => setDraggedQuestionIndex(null)}
                                                >
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-500">Question {index + 1}</span>
                                            </div>
                                        </div>

                                        {/* Core Settings Grid */}
                                        <div className="grid gap-5 sm:grid-cols-2 mb-5">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-slate-700">Question Label</Label>
                                                <Input
                                                    value={q.label}
                                                    onChange={(e) => updateCustomQuestionItem(q.id, 'label', e.target.value)}
                                                    placeholder="e.g. Name..?"
                                                    className="w-full px-4 py-2.5 mt-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    className="text-sm font-medium text-slate-700 cursor-pointer"
                                                    htmlFor={`answer-type-trigger-${q.id}`}
                                                >
                                                    Answer Type
                                                </Label>
                                                <Select
                                                    value={q.type}
                                                    onValueChange={(val) => {
                                                        updateCustomQuestionItem(q.id, 'type', val as CustomQuestion['type'])
                                                        if (val === 'select' && (!q.options || q.options.length === 0)) {
                                                            // Two empty options by default, labels only via placeholders
                                                            updateCustomQuestionItem(q.id, 'options', ['', ''] as any)
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id={`answer-type-trigger-${q.id}`}
                                                        className="w-full px-4 py-2.5 mt-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-200">
                                                        <SelectItem value="text">
                                                            <div className="flex items-center gap-2">
                                                                <MdOutlineShortText className="w-4 h-4 text-primary-600" />
                                                                <span>Short Text</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="textarea">
                                                            <div className="flex items-center gap-2">
                                                                <BsTextParagraph className="w-4 h-4 text-primary-600" />
                                                                <span>Paragraph</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="select">
                                                            <div className="flex items-center gap-2">
                                                                <MdOutlineArrowDropDownCircle className="w-4 h-4 text-primary-600" />
                                                                <span>Dropdown</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="checkbox">
                                                            <div className="flex items-center gap-2">
                                                                <SquareCheckBig className="w-4 h-4 text-primary-600" />
                                                                <span>Checkbox</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Type Specific Configuration */}
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center gap-2">
                                            <Label className="text-sm font-medium text-slate-700">Configuration</Label>
                                                <Tooltip>
                                                    <TooltipTrigger
                                                        onMouseEnter={() => setShowTooltipForQuestion(q.id)}
                                                        onMouseLeave={() => setShowTooltipForQuestion(null)}
                                                        className="text-primary-600 hover:text-primary-700 transition-colors mt-1.5"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </TooltipTrigger>
                                                    {showTooltipForQuestion === q.id && (
                                                        <TooltipContent>
                                                            <p className="leading-relaxed">
                                                               Choose how this answer works. Options change based on the answer type.
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </div>

                                            {/* Text / Textarea Config */}
                                            {q.type === 'text' && (
                                                <div className="space-y-2">
                                                    <Input
                                                        value={q.placeholder || ''}
                                                        onChange={(e) => updateCustomQuestionItem(q.id, 'placeholder', e.target.value)}
                                                        placeholder="Type your placeholder here..."
                                                        className="w-full px-4 mt-2 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                </div>
                                            )}
                                            {q.type === 'textarea' && (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        value={q.placeholder || ''}
                                                        onChange={(e) => updateCustomQuestionItem(q.id, 'placeholder', e.target.value)}
                                                        placeholder="Type your placeholder here..."
                                                        className="w-full px-4 mt-2 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-y min-h-[100px]"
                                                    />
                                                </div>
                                            )}

                                            {/* Options Config - Dropdown / Checkbox (same UI) */}
                                            {(q.type === 'select' || q.type === 'checkbox') && (
                                                <div className="space-y-4 pt-2">
                                                    <div className="space-y-3">
                                                        {(q.options && q.options.length > 0 ? q.options : ['', '']).map((opt, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2"
                                                                draggable
                                                                onDragStart={(e) => {
                                                                    e.dataTransfer.setData('text/plain', JSON.stringify({ questionId: q.id, fromIndex: index }))
                                                                }}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => {
                                                                    e.preventDefault()
                                                                    try {
                                                                        const data = JSON.parse(e.dataTransfer.getData('text/plain'))
                                                                        if (data.questionId === q.id && typeof data.fromIndex === 'number') {
                                                                            handleOptionReorder(q.id, data.fromIndex, index)
                                                                        }
                                                                    } catch {
                                                                        // ignore invalid drops
                                                                    }
                                                                }}
                                                            >
                                                                <div className="text-slate-300 cursor-move hover:text-slate-500 p-1 rounded-lg hover:bg-white transition-colors">
                                                                    <GripVertical className="w-4 h-4" />
                                                                </div>
                                                                {q.type === 'checkbox' && (
                                                                    <div className="h-4 w-4 rounded border border-slate-300 bg-white flex-shrink-0" />
                                                                )}
                                                                <Input
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const base = q.options && q.options.length > 0 ? [...q.options] : ['', '']
                                                                        const newOptions = [...base]
                                                                        newOptions[index] = e.target.value
                                                                        updateCustomQuestionItem(q.id, 'options', newOptions as any)
                                                                    }}
                                                                    placeholder={`Option ${index + 1}`}
                                                                    className="h-9 w-1/3 min-w-[140px] rounded-lg border border-slate-200 bg-white text-sm"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const currentOptions = q.options && q.options.length > 0 ? [...q.options] : ['', '']
                                                                        const newOptions = currentOptions.filter((_, i) => i !== index)
                                                                        updateCustomQuestionItem(q.id, 'options', (newOptions.length > 0 ? newOptions : [''] as any))
                                                                    }}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <X className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {q.type === 'checkbox' ? (
                                                        <div className="flex items-center gap-6 mt-4">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1 border border-slate-300 rounded-lg"
                                                                onClick={() => {
                                                                    const baseOptions = q.options && q.options.length > 0 ? [...q.options] : ['', '']
                                                                    const nextIndex = baseOptions.length + 1
                                                                    baseOptions.push('')
                                                                    updateCustomQuestionItem(q.id, 'options', baseOptions as any)
                                                                }}
                                                            >
                                                                <Plus className="w-4 h-4 mr-1" />
                                                                Add another option
                                                            </Button>
                                                            <label htmlFor={`allow-other-${q.id}`} className="flex items-center space-x-2 cursor-pointer select-none">
                                                                <input
                                                                    id={`allow-other-${q.id}`}
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border border-slate-300"
                                                                    style={{ accentColor: 'var(--primary-600)' }}
                                                                    checked={q.allowOther || false}
                                                                    onChange={(e) => updateCustomQuestionItem(q.id, 'allowOther', e.target.checked)}
                                                                />
                                                                <span className="text-sm font-normal text-slate-600">
                                                                    Allow "Other" option
                                                                </span>
                                                            </label>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1 border border-slate-300 rounded-lg"
                                                                onClick={() => {
                                                                    const baseOptions = q.options && q.options.length > 0 ? [...q.options] : ['', '']
                                                                    const nextIndex = baseOptions.length + 1
                                                                    baseOptions.push('')
                                                                    updateCustomQuestionItem(q.id, 'options', baseOptions as any)
                                                                }}
                                                            >
                                                                <Plus className="w-4 h-4 mr-1" />
                                                                Add another option
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Options Config - Radio (if used) */}
                                            {q.type === 'radio' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Textarea
                                                            value={q.options?.join(', ') || ''}
                                                            onChange={(e) => updateCustomQuestionItem(q.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                            placeholder="Option 1, Option 2, Option 3"
                                                            className="min-h[80px] w-full px-4 py-3 rounded-xl mt-2 border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-mono text-sm resize-none"
                                                        />
                                                        <p className="text-xs text-slate-400">Separate options with commas</p>
                                                    </div>

                                                    <label htmlFor={`allow-other-${q.id}`} className="flex items-center space-x-2 cursor-pointer select-none">
                                                        <input
                                                            id={`allow-other-${q.id}`}
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border border-slate-300"
                                                            style={{ accentColor: 'var(--primary-600)' }}
                                                                checked={q.allowOther || false}
                                                            onChange={(e) => updateCustomQuestionItem(q.id, 'allowOther', e.target.checked)}
                                                            />
                                                        <span className="text-sm font-normal text-slate-600">Allow "Other" option</span>
                                                    </label>
                                                </div>
                                            )}

                                            {/* Common Toggles + Delete aligned bottom-right (toggle before delete) */}
                                            <div className="border-t border-slate-200 pt-4 mt-4">
                                                <div className="flex items-center justify-end gap-4">
                                                    <div className="flex items-center space-x-3">
                                                <Switch
                                                    checked={q.required}
                                                    onCheckedChange={(c) => updateCustomQuestionItem(q.id, 'required', c)}
                                                    id={`required-${q.id}`}
                                                    className="data-[state=checked]:bg-primary-600"
                                                />
                                                <Label htmlFor={`required-${q.id}`} className="text-sm font-normal text-slate-600">Required field</Label>
                                                    </div>
                                                    <div className="h-6 w-px bg-slate-300"></div>
                                                    <Tooltip>
                                                        <div
                                                            onMouseEnter={() => {
                                                                // Clear any existing timeout for this question
                                                                if (deleteTooltipTimeoutRef.current[q.id]) {
                                                                    clearTimeout(deleteTooltipTimeoutRef.current[q.id])
                                                                }
                                                                // Set timeout to show tooltip after 2 seconds
                                                                deleteTooltipTimeoutRef.current[q.id] = setTimeout(() => {
                                                                    setShowDeleteTooltipForQuestion(q.id)
                                                                }, 500)
                                                            }}
                                                            onMouseLeave={() => {
                                                                // Clear timeout if mouse leaves before 2 seconds
                                                                if (deleteTooltipTimeoutRef.current[q.id]) {
                                                                    clearTimeout(deleteTooltipTimeoutRef.current[q.id])
                                                                    deleteTooltipTimeoutRef.current[q.id] = undefined as any
                                                                }
                                                                setShowDeleteTooltipForQuestion(null)
                                                            }}
                                                            className="relative inline-block"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                onClick={() => removeCustomQuestion(q.id)}
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </Button>
                                                            {showDeleteTooltipForQuestion === q.id && (
                                                                <TooltipContent className="w-auto whitespace-nowrap">
                                                                    <p>Delete question</p>
                                                                </TooltipContent>
                                                            )}
                                                        </div>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Preview */}
                                        <LivePreviewSection q={q} />
                                    </div>
                                ))}
                                </div>
                                {formData.customQuestions.length > 0 && (
                                    <div className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
                                        <button
                                            onClick={addCustomQuestion}
                                            className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer group"
                                        >
                                            <Plus className="w-5 h-5 text-primary-600 transition-colors" />
                                        </button>
                                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Add more questions..</h3>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </TabTransition>
    )
}

