"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Sparkles, HelpCircle, UploadCloud } from "lucide-react"
import { EditorFormData, CustomQuestion, UploadField } from '../../types'
import { QuestionsList } from './questions/QuestionsList'
import { UploadFieldsList } from './questions/UploadFieldsList'

interface SetupStepProps {
    formData: EditorFormData
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void
    addCustomQuestion: () => void
    removeCustomQuestion: (id: string) => void
    updateCustomQuestionItem: <K extends keyof CustomQuestion>(id: string, key: K, value: CustomQuestion[K]) => void
    addUploadField: () => void
    removeUploadField: (id: string) => void
    updateUploadFieldItem: (id: string, updates: Partial<UploadField>) => void
}

export function SetupStep({
    formData,
    updateField,
    addCustomQuestion,
    removeCustomQuestion,
    updateCustomQuestionItem,
    addUploadField,
    removeUploadField,
    updateUploadFieldItem
}: SetupStepProps) {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Form Title and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-white/85 backdrop-blur border border-primary-50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-800">Form Title</Label>
                            
                        </div>
                    </div>
                    <Input
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Untitled Form"
                        className="h-11 rounded-xl border-primary-100 focus:border-primary-600 focus:ring-0 focus-visible:ring-0"
                        autoFocus
                    />
                </div>

                <div className="space-y-3 bg-white/85 backdrop-blur border border-primary-50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <Label className="text-sm font-semibold text-gray-800">
                                Description <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            
                        </div>
                    </div>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Tell people what files you need..."
                        rows={3}
                        className="resize-none rounded-xl border-primary-100 focus:border-primary-600 focus:ring-0 focus-visible:ring-0"
                    />
                </div>
            </div>

            {/* Questions and Upload Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Questions Section */}
                <div className="space-y-4 bg-white/85 backdrop-blur border border-primary-50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-gray-800">Custom Questions</Label>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={addCustomQuestion} 
                            size="sm" 
                            className="h-9 px-3 border-primary-200 text-primary-700 hover:bg-primary-50"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Question
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <QuestionsList
                            questions={formData.customQuestions}
                            onQuestionsChange={(questions) => updateField('customQuestions', questions)}
                            onUpdateQuestion={updateCustomQuestionItem}
                            onDeleteQuestion={removeCustomQuestion}
                        />
                    </div>
                </div>

                {/* Upload Fields Section */}
                <div className="space-y-4 bg-white/85 backdrop-blur border border-primary-50 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
                                <UploadCloud className="w-5 h-5" />
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-gray-800">Upload Fields</Label>
                            </div>
                        </div>
                        {formData.uploadFields.length < 3 && (
                            <Button 
                                variant="outline" 
                                onClick={addUploadField} 
                                size="sm" 
                                className="h-9 px-3 border-primary-200 text-primary-700 hover:bg-primary-50"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Add Field
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <UploadFieldsList
                            fields={formData.uploadFields}
                            onFieldsChange={(fields) => updateField('uploadFields', fields)}
                            onUpdateField={updateUploadFieldItem}
                            onDeleteField={removeUploadField}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
