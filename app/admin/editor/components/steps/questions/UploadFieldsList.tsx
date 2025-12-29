"use client"

import { UploadField } from "../../../types"
import { Reorder } from "framer-motion"
import { UploadFieldCard } from "./UploadFieldCard"

interface UploadFieldsListProps {
    fields: UploadField[]
    onFieldsChange: (fields: UploadField[]) => void
    onUpdateField: (id: string, updates: Partial<UploadField>) => void
    onDeleteField: (id: string) => void
}

export function UploadFieldsList({
    fields,
    onFieldsChange,
    onUpdateField,
    onDeleteField
}: UploadFieldsListProps) {
    return (
        <div className="h-full flex flex-col">
            <Reorder.Group
                axis="y"
                values={fields}
                onReorder={onFieldsChange}
                className="space-y-4 flex-1"
            >
                {fields.map((field) => (
                    <UploadFieldCard
                        key={field.id}
                        field={field}
                        onUpdate={(updates) => onUpdateField(field.id, updates)}
                        onDelete={() => onDeleteField(field.id)}
                    />
                ))}
            </Reorder.Group>
        </div>
    )
}

