"use client"

import { CustomQuestion } from "../../../types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GripVertical, Trash2, Plus, X, AlignLeft, AlignJustify, List, CheckSquare } from "lucide-react"
import { Reorder, useDragControls } from "framer-motion"

interface QuestionCardProps {
  question: CustomQuestion
  onUpdate: <K extends keyof CustomQuestion>(key: K, value: CustomQuestion[K]) => void
  onDelete: () => void
}

export function QuestionCard({ question, onUpdate, onDelete }: QuestionCardProps) {
  const controls = useDragControls()

  const handleAddOption = () => {
    const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`]
    onUpdate("options", newOptions)
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(question.options || [])]
    newOptions[index] = value
    onUpdate("options", newOptions)
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = (question.options || []).filter((_, i) => i !== index)
    onUpdate("options", newOptions)
  }

  return (
    <Reorder.Item
      value={question}
      id={question.id}
      dragListener={false}
      dragControls={controls}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500 rounded-l-xl opacity-0 transition-opacity data-[active=true]:opacity-100" />

      {/* Drag Handle - Top Center */}
      <div
        className="h-6 w-full flex items-center justify-center cursor-move hover:bg-gray-50 rounded-t-xl transition-colors"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-4 h-4 text-gray-300 transform rotate-90" />
      </div>

      <div className="px-6 pb-6 pt-2 space-y-6">
        {/* Header: Label & Type */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 space-y-2">
            <Input
              value={question.label}
              onChange={(e) => onUpdate("label", e.target.value)}
              placeholder="Question"
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
            />
          </div>
          <div className="w-[180px] flex-shrink-0">
            <Select
              value={question.type}
              onValueChange={(value) => onUpdate("type", value)}
            >
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-gray-400" />
                    <span>Short Answer</span>
                  </div>
                </SelectItem>
                <SelectItem value="textarea">
                  <div className="flex items-center gap-2">
                    <AlignJustify className="w-4 h-4 text-gray-400" />
                    <span>Paragraph</span>
                  </div>
                </SelectItem>
                <SelectItem value="select">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4 text-gray-400" />
                    <span>Dropdown</span>
                  </div>
                </SelectItem>
                <SelectItem value="checkbox">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-gray-400" />
                    <span>Checkboxes</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="pl-1">
          {question.type === "text" && (
            <div className="border-b border-gray-200 pb-2 w-1/2">
              <span className="text-gray-400 text-sm">Short answer text</span>
            </div>
          )}

          {question.type === "textarea" && (
            <div className="border-b border-gray-200 pb-2 w-3/4">
              <span className="text-gray-400 text-sm">Long answer text</span>
            </div>
          )}

          {(question.type === "select" || question.type === "checkbox") && (
            <div className="space-y-3">
              {(question.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-3 group/option">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {question.type === "select" ? (
                      <span className="text-xs text-gray-400">{index + 1}.</span>
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-md" />
                    )}
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="h-9 max-w-sm border-transparent hover:border-gray-200 focus:border-primary-500 bg-transparent px-2"
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    className="h-8 w-8 text-gray-400 opacity-0 group-hover/option:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-3 pl-1">
                <div className="w-4 h-4 flex items-center justify-center">
                  {question.type === "select" ? (
                    <span className="text-xs text-gray-400">{(question.options?.length || 0) + 1}.</span>
                  ) : (
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-md" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-8 text-gray-500 hover:text-primary-600 px-2"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Option
                </Button>
                {question.type === "checkbox" && (
                  <div className="flex items-center gap-2 ml-4">
                    <Label htmlFor={`allow-other-${question.id}`} className="text-xs text-gray-500 font-normal">Allow 'Other'</Label>
                    <Switch
                      id={`allow-other-${question.id}`}
                      checked={question.allowOther || false}
                      onCheckedChange={(c) => onUpdate("allowOther", c)}
                      className="scale-75"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Switch
              checked={question.required}
              onCheckedChange={(c) => onUpdate("required", c)}
              id={`required-${question.id}`}
            />
            <Label htmlFor={`required-${question.id}`} className="text-sm text-gray-600 cursor-pointer">Required</Label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Reorder.Item>
  )
}
