import UploadForm from "@/components/upload-form"

export default async function UploadPage({ params }: { params: Promise<{ formId: string }> }) {
    const { formId } = await params
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <UploadForm formId={formId} />
        </div>
    )
}
