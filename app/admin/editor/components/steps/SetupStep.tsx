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
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Form Title and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Form Title</Label>
                    <Input
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Untitled Form"
                        className="h-11 mt-2"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                        Description <span className="text-gray-400 font-normal">(optional)</span>
                    </Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Eg., Any Instructions.."
                        rows={3}
                        className="resize-none mt-2 text-gray-100"
                    />
                </div>
            </div>

            {/* Questions and Upload Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Questions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">
                            Questions <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <Button 
                            variant="outline" 
                            onClick={addCustomQuestion} 
                            size="sm" 
                            className="h-8 px-3 text-primary-600 border-primary-200 hover:bg-primary-50"
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
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Upload Fields</Label>
                        {formData.uploadFields.length < 3 && (
                            <Button 
                                variant="outline" 
                                onClick={addUploadField} 
                                size="sm" 
                                className="h-8 px-3 text-primary-600 border-primary-200 hover:bg-primary-50"
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
