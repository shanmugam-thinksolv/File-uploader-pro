import UploadForm from "@/components/upload-form"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function UploadPage({ params }: { params: Promise<{ formId: string }> }) {
    const { formId } = await params

    const form = await prisma.form.findUnique({
        where: { id: formId }
    })

    if (!form) {
        notFound()
    }

    // Parse JSON fields safely
    const formData = form as any

    // Handle uploadFields - could be null, undefined, object, or string
    let uploadFields = formData.uploadFields
    if (typeof uploadFields === 'string') {
        try {
            uploadFields = JSON.parse(uploadFields)
        } catch (e) {
            uploadFields = null
        }
    }

    // Handle customQuestions - could be null, undefined, object, or string
    let customQuestions = formData.customQuestions
    if (typeof customQuestions === 'string') {
        try {
            customQuestions = JSON.parse(customQuestions)
        } catch (e) {
            customQuestions = null
        }
    }

    // Ensure uploadFields is always an array with properly formatted data
    if (!uploadFields || !Array.isArray(uploadFields) || uploadFields.length === 0) {
        uploadFields = [{
            id: "default",
            label: "Upload File",
            allowedTypes: [],
            maxSize: (formData.maxSizeMB || 5) * 1024 * 1024
        }]
    } else {
        // Fix each upload field to ensure allowedTypes is an array
        uploadFields = uploadFields.map((field: any) => ({
            ...field,
            // Convert allowedTypes to array if it's a string
            allowedTypes: Array.isArray(field.allowedTypes)
                ? field.allowedTypes
                : (typeof field.allowedTypes === 'string' && field.allowedTypes
                    ? field.allowedTypes.split(',').filter(Boolean)
                    : []),
            maxSize: field.maxSize || (field.maxSizeMB ? field.maxSizeMB * 1024 * 1024 : 5 * 1024 * 1024)
        }))
    }

    // Ensure customQuestions is always an array
    if (!customQuestions || !Array.isArray(customQuestions)) {
        customQuestions = []
    }

    // Serialize the form data properly to avoid hydration issues
    const parsedForm = {
        title: formData.title || 'File Upload',
        description: formData.description || '',
        primaryColor: formData.primaryColor || '#4f46e5',
        backgroundColor: formData.backgroundColor || '#ffffff',
        fontFamily: formData.fontFamily || 'Inter',
        buttonTextColor: formData.buttonTextColor || '#ffffff',
        cardStyle: formData.cardStyle || 'shadow',
        borderRadius: formData.borderRadius || 'md',
        allowedTypes: formData.allowedTypes || '',
        maxSizeMB: formData.maxSizeMB || 5,
        isPasswordProtected: formData.isPasswordProtected || false,
        password: formData.password || null,
        enableSubmitAnother: formData.enableSubmitAnother || true,
        isAcceptingResponses: formData.isAcceptingResponses !== false,
        logoUrl: formData.logoUrl || '',
        expiryDate: formData.expiryDate ? formData.expiryDate.toISOString() : null,
        uploadFields,
        customQuestions
    }

    return (
        <div
            className="min-h-screen py-12 flex flex-col"
            style={{
                backgroundColor: parsedForm.backgroundColor,
                fontFamily: parsedForm.fontFamily
            }}
        >
            <div className="flex-grow">
                <UploadForm formId={formId} initialData={parsedForm as any} />
            </div>

            <footer className="mt-12 text-center text-sm text-gray-500 pb-6">
                <p>
                    Powered by <span className="font-semibold text-primary">File Uploader Pro</span>
                </p>
                <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 underline mt-2 inline-block">
                    Create your own form
                </Link>
            </footer>
        </div>
    )
}
