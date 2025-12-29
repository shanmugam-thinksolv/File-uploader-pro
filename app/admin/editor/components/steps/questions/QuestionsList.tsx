"use client"

import { CustomQuestion } from "../../../types"
import { Reorder } from "framer-motion"
import { QuestionCard } from "./QuestionCard"

interface QuestionsListProps {
    questions: CustomQuestion[]
    onQuestionsChange: (questions: CustomQuestion[]) => void
    onUpdateQuestion: <K extends keyof CustomQuestion>(id: string, key: K, value: CustomQuestion[K]) => void
    onDeleteQuestion: (id: string) => void
}

export function QuestionsList({
    questions,
    onQuestionsChange,
    onUpdateQuestion,
    onDeleteQuestion
}: QuestionsListProps) {
    return (
        <div className="h-full flex flex-col">
            <Reorder.Group
                axis="y"
                values={questions}
                onReorder={onQuestionsChange}
                className="space-y-4 flex-1"
            >
                {questions.map((question) => (
                    <QuestionCard
                        key={question.id}
                        question={question}
                        onUpdate={(key, value) => onUpdateQuestion(question.id, key, value)}
                        onDelete={() => onDeleteQuestion(question.id)}
                    />
                ))}
            </Reorder.Group>
        </div>
    )
}
