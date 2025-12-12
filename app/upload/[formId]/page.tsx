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

    // Check if form has expired
    if (form.expiryDate) {
        const expiryDate = new Date(form.expiryDate)
        const now = new Date()
        if (now > expiryDate) {
            // Form has expired
            return (
                <div className="min-h-screen py-12 flex flex-col items-center justify-center" style={{
                    backgroundColor: form.backgroundColor || '#ffffff'
                }}>
                    <div className="w-full max-w-2xl mx-auto p-4">
                        <div className="bg-white rounded-lg shadow-lg border border-orange-200 p-8 text-center">
                            <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-4">
                                <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-orange-600 mb-2">Form Expired</h1>
                            <p className="text-gray-600 mb-4">
                                This form is no longer accepting submissions.
                            </p>
                            <p className="text-sm text-gray-500">
                                The form expired on {expiryDate.toLocaleDateString()} at {expiryDate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <footer className="mt-12 text-center text-sm text-gray-500 pb-6">
                        <p>
                            Powered by <span className="font-semibold" style={{ color: form.primaryColor || '#4f46e5' }}>File Uploader Pro</span>
                        </p>
                        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 underline mt-2 inline-block">
                            Create your own form
                        </Link>
                    </footer>
                </div>
            )
        }
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
            allowedTypes: []
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
                    : [])
            // No maxSize limit - users can upload any size
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
                backgroundColor: parsedForm.backgroundColor
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
