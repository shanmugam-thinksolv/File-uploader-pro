"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Plus, FileText, Loader2, ExternalLink, AlertTriangle, X, CheckCircle } from "lucide-react"

export default function AdminDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; formId: string | null; isActive: boolean }>({
        isOpen: false,
        formId: null,
        isActive: false
    })
    const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    })

    useEffect(() => {
        fetchForms()
    }, [])

    const fetchForms = async () => {
        try {
            const res = await fetch('/api/forms')
            const data = await res.json()
            setForms(data)
        } catch (error) {
            console.error('Failed to fetch forms', error)
        } finally {
            setLoading(false)
        }
    }

    const showMessage = (title: string, message: string, type: 'success' | 'error' = 'error') => {
        setMessageModal({ isOpen: true, title, message, type })
    }

    const handleToggleStatus = async (formId: string, currentStatus: boolean) => {
        // Optimistic update
        setForms(forms.map(f =>
            f.id === formId ? { ...f, isAcceptingResponses: !currentStatus } : f
        ))

        try {
            const res = await fetch(`/api/forms/${formId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAcceptingResponses: !currentStatus })
            })

            if (!res.ok) {
                // Revert if failed
                setForms(forms.map(f =>
                    f.id === formId ? { ...f, isAcceptingResponses: currentStatus } : f
                ))
                showMessage('Error', 'Failed to update status', 'error')
            }
        } catch (error) {
            console.error('Failed to update status', error)
            // Revert if failed
            setForms(forms.map(f =>
                f.id === formId ? { ...f, isAcceptingResponses: currentStatus } : f
            ))
            showMessage('Error', 'Failed to update status', 'error')
        }
    }

    const openDeleteModal = (formId: string, isActive: boolean) => {
        setDeleteModal({ isOpen: true, formId, isActive })
    }

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, formId: null, isActive: false })
    }

    const confirmDelete = async () => {
        if (!deleteModal.formId) return

        try {
            const res = await fetch(`/api/forms/${deleteModal.formId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setForms(forms.filter(f => f.id !== deleteModal.formId))
                closeDeleteModal()
            } else {
                showMessage('Error', 'Failed to delete form', 'error')
            }
        } catch (error) {
            console.error('Failed to delete form', error)
            showMessage('Error', 'Failed to delete form', 'error')
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Forms</h2>
                    <p className="text-muted-foreground">Manage your file upload forms.</p>
                </div>
                <Link href="/admin/editor?id=new&tab=configuration">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Form
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">No forms created yet</p>
                    <Link href="/admin/editor?id=new&tab=configuration">
                        <Button variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Form
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {forms.map((form) => (
                        <div
                            key={form.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-4 flex-wrap">
                                <h3 className="text-base font-semibold text-gray-900">{form.title}</h3>

                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                    <Switch
                                        checked={form.isAcceptingResponses}
                                        onCheckedChange={() => handleToggleStatus(form.id, form.isAcceptingResponses)}
                                        className="scale-75"
                                    />
                                    <span className={`text-xs font-medium ${form.isAcceptingResponses ? 'text-green-600' : 'text-gray-500'}`}>
                                        {form.isAcceptingResponses ? 'Accepting Responses' : 'Form Closed'}
                                    </span>
                                </div>

                                <span className="text-sm text-gray-400 hidden sm:inline">•</span>
                                <p className="text-sm text-gray-500">
                                    Created on {formatDate(form.createdAt)} • {form._count?.submissions || 0} Submissions
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/upload/${form.id}`} target="_blank">
                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                                        <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
                                        Public Link
                                    </Button>
                                </Link>
                                <Link href={`/admin/uploads?formId=${form.id}`}>
                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                        View Uploads
                                    </Button>
                                </Link>
                                <Link href={`/admin/editor?id=${form.id}&tab=configuration`}>
                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 px-4">
                                        Edit
                                    </Button>
                                </Link>
                                <button
                                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 text-sm font-medium rounded-md transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        openDeleteModal(form.id, form.isAcceptingResponses)
                                    }}
                                    type="button"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeDeleteModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeDeleteModal}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        {/* Warning Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                            Delete Form?
                        </h3>

                        {/* Message */}
                        <p className="text-gray-600 text-center mb-6 leading-relaxed">
                            {deleteModal.isActive ? (
                                <>
                                    This form is currently <span className="font-semibold text-red-600">ACTIVE</span> and accepting responses.
                                    Are you sure you want to delete it? This action cannot be undone.
                                </>
                            ) : (
                                'Are you sure you want to delete this form? This action cannot be undone and all submissions will be lost.'
                            )}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={closeDeleteModal}
                                className="flex-1 h-11 text-gray-700 border-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
                            >
                                Delete Form
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {messageModal.isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex justify-center mb-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${messageModal.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
                                {messageModal.type === 'error' ? (
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                ) : (
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                )}
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                            {messageModal.title}
                        </h3>

                        <p className="text-gray-600 text-center mb-6 leading-relaxed">
                            {messageModal.message}
                        </p>

                        <div className="flex justify-center">
                            <Button
                                onClick={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
                                className={`min-w-[120px] h-11 ${messageModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                Okay
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
