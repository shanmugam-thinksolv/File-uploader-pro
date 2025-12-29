"use client"

import { UploadField } from "../../../types"
import { Input } from "@/components/ui/input"
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
import { GripVertical, Trash2, File, Image, FileText, HardDrive } from "lucide-react"
import { Reorder, useDragControls } from "framer-motion"

interface UploadFieldCardProps {
  field: UploadField
  onUpdate: (updates: Partial<UploadField>) => void
  onDelete: () => void
}

export function UploadFieldCard({ field, onUpdate, onDelete }: UploadFieldCardProps) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={field}
      id={field.id}
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
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Untitled Field"
              className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
            />
          </div>
          <div className="w-[200px] flex-shrink-0">
            <Select
              value={field.allowedTypes || "any"}
              onValueChange={(value) => onUpdate({ allowedTypes: value })}
            >
              <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-gray-400" />
                    <span>Any file</span>
                  </div>
                </SelectItem>
                <SelectItem value="images">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-400" />
                    <span>Images Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="docs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span>Documents Only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes Area */}
        <div className="pl-1 space-y-4 py-1.5">
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <label className="flex items-center gap-2.5 group/check cursor-pointer">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id={`multiple-${field.id}`}
                  checked={field.allowMultiple}
                  onChange={(e) => onUpdate({ allowMultiple: e.target.checked })}
                  className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:border-primary-500 checked:bg-primary-500 transition-all cursor-pointer"
                />
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="text-sm text-gray-600 font-medium group-hover/check:text-gray-900 transition-colors">Allow Multiple Files</span>
            </label>

            <label className="flex items-center gap-2.5 group/check cursor-pointer">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id={`folder-${field.id}`}
                  checked={field.allowFolder}
                  onChange={(e) => onUpdate({ allowFolder: e.target.checked })}
                  className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:border-primary-500 checked:bg-primary-500 transition-all cursor-pointer"
                />
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="text-sm text-gray-600 font-medium group-hover/check:text-gray-900 transition-colors">Allow Folder Upload</span>
            </label>
          </div>

          {/* File Size Limit */}
          <div className="flex items-center gap-3 pt-2">
            <HardDrive className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <Label htmlFor={`maxSize-${field.id}`} className="text-sm text-gray-600 whitespace-nowrap">
                Max file size:
              </Label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  id={`maxSize-${field.id}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={field.maxFileSize || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                    onUpdate({ maxFileSize: value && value > 0 ? value : undefined })
                  }}
                  placeholder="No limit"
                  className="h-9 w-24 bg-gray-50 border-gray-200 focus:bg-white"
                />
                <span className="text-sm text-gray-500">MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Switch
              checked={field.required}
              onCheckedChange={(c) => onUpdate({ required: c })}
              id={`required-field-${field.id}`}
            />
            <Label htmlFor={`required-field-${field.id}`} className="text-sm text-gray-600 cursor-pointer">Required</Label>
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
