import UploadForm from "@/components/upload-form"

export default function PreviewPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <UploadForm isPreview={true} />
        </div>
    )
}
