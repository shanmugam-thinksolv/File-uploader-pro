"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent } from "@/components/ui/tooltip"
import { Plus, FileText, Loader2, ExternalLink, AlertTriangle, X, CheckCircle, Clock, Pencil, Send, Trash2 } from "lucide-react"

// Tooltip wrapper component for buttons
function ButtonWithTooltip({ 
    children, 
    tooltipText 
}: { 
    children: React.ReactNode
    tooltipText: string
}) {
    const [showTooltip, setShowTooltip] = useState(false)
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    return (
        <Tooltip>
            <div
                onMouseEnter={() => {
                    if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                    }
                    tooltipTimeoutRef.current = setTimeout(() => {
                        setShowTooltip(true)
                    }, 500)
                }}
                onMouseLeave={() => {
                    if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current)
                        tooltipTimeoutRef.current = null
                    }
                    setShowTooltip(false)
                }}
                className="relative inline-block"
            >
                {children}
                {showTooltip && (
                    <TooltipContent className="w-auto whitespace-nowrap">
                        <p>{tooltipText}</p>
                    </TooltipContent>
                )}
            </div>
        </Tooltip>
    )
}

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [publishingFormId, setPublishingFormId] = useState<string | null>(null)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; formId: string | null; isActive: boolean }>({
        isOpen: false,
        formId: null,
        isActive: false
    })
    const [messageModal, setMessageModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'expired' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    })
    const [publishValidationModal, setPublishValidationModal] = useState<{ isOpen: boolean; formId: string | null; missingFields: string[] }>({
        isOpen: false,
        formId: null,
        missingFields: []
    })

    // Check authentication status
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/admin/login")
        }
    }, [status, router])

    const fetchForms = useCallback(async () => {
        try {
            const res = await fetch('/api/forms')
            const data = await res.json()
            
            // Handle error responses
            if (!res.ok) {
                console.error('API error:', data.error || 'Failed to fetch forms')
                setForms([])
                return
            }
            
            // Ensure data is an array
            if (Array.isArray(data)) {
                setForms(data)
            } else {
                console.error('API returned non-array data:', data)
                setForms([])
            }
        } catch (error) {
            console.error('Failed to fetch forms', error)
            setForms([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (status === "authenticated") {
            fetchForms()
        }
    }, [status, fetchForms])

    // Refresh forms when navigating back to dashboard (e.g., after creating/editing form)
    useEffect(() => {
        if (status === "authenticated" && pathname === '/admin/dashboard') {
            fetchForms()
        }
    }, [pathname, status, fetchForms])

    const showMessage = (title: string, message: string, type: 'success' | 'error' | 'expired' = 'error') => {
        setMessageModal({ isOpen: true, title, message, type })
    }

    const isFormExpired = (form: any) => {
        if (!form.expiryDate) return false
        const expiryDate = new Date(form.expiryDate)
        const now = new Date()
        return now > expiryDate
    }

    const handleToggleStatus = async (formId: string, currentStatus: boolean, form: any) => {
        // Only allow toggling if form is published
        if (!form.isPublished) {
            showMessage('Error', 'Form must be published before it can accept responses', 'error')
            return
        }

        // Check if form is expired
        if (isFormExpired(form)) {
            // If trying to enable an expired form, show tooltip/message
            if (!currentStatus) {
                showMessage(
                    'Form Expired',
                    'This form has expired. Please update the expiry date in the form editor to enable it again.',
                    'expired'
                )
                return
            }
        }

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
            } else {
                // Refresh forms to get updated expiry status
                fetchForms()
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

    // Validation rules - each rule returns a message if validation fails, null if passed
    const validateFormTitle = (formData: any): string | null => {
        // Check if title is empty or just whitespace (treat "Untitled Form" as empty since it's a placeholder)
        const title = formData.title === 'Untitled Form' ? '' : (formData.title || '')
        if (!title || title.trim() === '') {
            return 'Please add a form title.'
        }
        return null
    }

    const validateUploadFields = (formData: any): string | null => {
        let uploadFields = []
        try {
            uploadFields = typeof formData.uploadFields === 'string' 
                ? JSON.parse(formData.uploadFields) 
                : (formData.uploadFields || [])
        } catch (e) {
            uploadFields = []
        }
        
        const filledUploadFields = uploadFields.filter((field: any) => 
            field && field.label && field.label.trim() !== ''
        )
        
        if (filledUploadFields.length === 0) {
            return 'At least one file upload field is required'
        }
        return null
    }

    const validateRequiredFields = (formData: any): string | null => {
        // Check if there are any required custom questions that need configuration
        let customQuestions = []
        try {
            customQuestions = typeof formData.customQuestions === 'string' 
                ? JSON.parse(formData.customQuestions) 
                : (formData.customQuestions || [])
        } catch (e) {
            customQuestions = []
        }

        // Check if there are required questions without proper configuration
        const requiredQuestions = customQuestions.filter((q: any) => q.required === true)
        const invalidRequiredQuestions = requiredQuestions.filter((q: any) => {
            // Check if required question has proper configuration
            if (!q.label || q.label.trim() === '') return true
            
            // For select/radio/checkbox, check if options are configured
            if ((q.type === 'select' || q.type === 'radio' || q.type === 'checkbox')) {
                if (!q.options || q.options.length === 0 || q.options.every((opt: string) => !opt || opt.trim() === '')) {
                    return true
                }
            }
            
            return false
        })

        if (invalidRequiredQuestions.length > 0) {
            return 'Required fields must be configured'
        }
        return null
    }

    const handlePublish = async (formId: string) => {
        // Set loading state immediately
        setPublishingFormId(formId)
        
        try {
            // First, fetch the full form data to validate
            const formRes = await fetch(`/api/forms/${formId}`)
            if (!formRes.ok) {
                showMessage('Error', 'Failed to fetch form data', 'error')
                setPublishingFormId(null)
                return
            }

            const formData = await formRes.json()
            
            // Run all validation rules and collect failures
            const validationRules = [
                validateFormTitle,
                validateUploadFields,
                validateRequiredFields
            ]
            
            const validationErrors: string[] = []
            for (const rule of validationRules) {
                const error = rule(formData)
                if (error) {
                    validationErrors.push(error)
                }
            }
            
            // If validation fails, show modal
            if (validationErrors.length > 0) {
                setPublishingFormId(null)
                setPublishValidationModal({
                    isOpen: true,
                    formId,
                    missingFields: validationErrors
                })
                return
            }
            
            // Validation passed, proceed with publishing
            const res = await fetch(`/api/forms/${formId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    isPublished: true,
                    isAcceptingResponses: true // Enable accepting responses when publishing
                })
            })

            if (res.ok) {
                showMessage('Success', 'Form published successfully', 'success')
                fetchForms()
            } else {
                const errorData = await res.json()
                showMessage('Error', errorData.error || 'Failed to publish form', 'error')
            }
        } catch (error) {
            console.error('Failed to publish form', error)
            showMessage('Error', 'Failed to publish form', 'error')
        } finally {
            setPublishingFormId(null)
        }
    }

    const closePublishValidationModal = () => {
        setPublishValidationModal({ isOpen: false, formId: null, missingFields: [] })
    }

    const handleGoToEdit = () => {
        if (publishValidationModal.formId) {
            // Add focusTitle parameter to trigger auto-focus on title input
            router.push(`/admin/editor?id=${publishValidationModal.formId}&tab=configuration&focusTitle=true`)
        }
        closePublishValidationModal()
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
                    <p className="text-muted-foreground mt-2">Manage your file upload forms.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/editor?id=new&tab=configuration">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Form
                        </Button>
                    </Link>
                </div>
            </div>

            {status === "loading" || loading ? (
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
                <div className="space-y-8">
                    {/* Published Forms */}
                    {forms.filter((form) => form.isPublished === true && !isFormExpired(form)).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Published</h3>
                            {forms.filter((form) => form.isPublished === true && !isFormExpired(form)).map((form) => {
                                const expired = isFormExpired(form)
                                // If form is expired, force isAcceptingResponses to false
                                const effectiveStatus = expired ? false : form.isAcceptingResponses
                                
                                return (
                                    <div
                                        key={form.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                                    >
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <h3 className="text-base font-semibold text-gray-900">{form.title}</h3>

                                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                <Switch
                                                    checked={effectiveStatus}
                                                    onCheckedChange={() => handleToggleStatus(form.id, effectiveStatus, form)}
                                                    className={`scale-75 ${expired ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                                <span className={`text-xs font-medium ${effectiveStatus ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {expired ? 'Form Expired' : (effectiveStatus ? 'Accepting Responses' : 'Not accepting responses')}
                                                </span>
                                            </div>

                                            <span className="text-sm text-gray-400 hidden sm:inline">•</span>
                                            <p className="text-sm text-gray-500">
                                                Created on {formatDate(form.createdAt)} • {form._count?.submissions || 0} Submissions
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ButtonWithTooltip tooltipText="Open form in new tab">
                                                <Link href={`/upload/${form.id}`} target="_blank">
                                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                                                        <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
                                                        Open Form
                                                    </Button>
                                                </Link>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="View all form submissions">
                                                <Link href={`/admin/uploads?formId=${form.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                                                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                                        View Uploads
                                                    </Button>
                                                </Link>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="Edit form">
                                                <Link href={`/admin/editor?id=${form.id}&tab=configuration`}>
                                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 px-4">
                                                        <Pencil className="w-4 h-4 mr-2 text-gray-500" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="Delete form">
                                                <button
                                                    className="h-9 w-9 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        openDeleteModal(form.id, form.isAcceptingResponses)
                                                    }}
                                                    type="button"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </ButtonWithTooltip>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Drafts */}
                    {forms.filter((form) => (!form.isPublished || form.isPublished === false) && !isFormExpired(form)).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Drafts</h3>
                            {forms.filter((form) => (!form.isPublished || form.isPublished === false) && !isFormExpired(form)).map((form) => {
                                return (
                                    <div
                                        key={form.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                                    >
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <h3 className="text-base font-semibold text-gray-900">{form.title}</h3>

                                            {/* Draft Badge */}
                                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                <span className="text-xs font-medium text-blue-600">
                                                    Draft
                                                </span>
                                            </div>

                                            <span className="text-sm text-gray-400 hidden sm:inline">•</span>
                                            <p className="text-sm text-gray-500">
                                                Created on {formatDate(form.createdAt)} • No submissions yet
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Publish Button */}
                                            <ButtonWithTooltip tooltipText="Publish form to make it live">
                                                <Button
                                                    onClick={() => handlePublish(form.id)}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={publishingFormId === form.id}
                                                    className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {publishingFormId === form.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 text-gray-500 animate-spin" />
                                                            <span className="inline-flex items-baseline">
                                                                Loading
                                                                <span className="relative -top-1">...</span>
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4 mr-2 text-gray-500" />
                                                            Publish
                                                        </>
                                                    )}
                                                </Button>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="Edit form">
                                                <Link href={`/admin/editor?id=${form.id}&tab=configuration`}>
                                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 px-4">
                                                        <Pencil className="w-4 h-4 mr-2 text-gray-500" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="Delete form">
                                                <button
                                                    className="h-9 w-9 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        openDeleteModal(form.id, form.isAcceptingResponses)
                                                    }}
                                                    type="button"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </ButtonWithTooltip>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Expired Forms */}
                    {forms.filter((form) => form.isPublished === true && isFormExpired(form)).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-gray-900">Expired</h3>
                            {forms.filter((form) => form.isPublished === true && isFormExpired(form)).map((form) => {
                                return (
                                    <div
                                        key={form.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm opacity-75"
                                    >
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <h3 className="text-base font-semibold text-gray-900">{form.title}</h3>

                                            {/* Expired Badge */}
                                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                                <span className="text-xs font-medium text-orange-600">
                                                    Expired
                                                </span>
                                            </div>

                                            <span className="text-sm text-gray-400 hidden sm:inline">•</span>
                                            <p className="text-sm text-gray-500">
                                                Created on {formatDate(form.createdAt)} • {form._count?.submissions || 0} Submissions
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ButtonWithTooltip tooltipText="View all form submissions">
                                                <Link href={`/admin/uploads?formId=${form.id}`}>
                                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                                                        <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                                        View Uploads
                                                    </Button>
                                                </Link>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="Edit form">
                                                <Link href={`/admin/editor?id=${form.id}&tab=configuration`}>
                                                    <Button variant="outline" size="sm" className="h-9 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 px-4">
                                                        <Pencil className="w-4 h-4 mr-2 text-gray-500" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </ButtonWithTooltip>
                                            <ButtonWithTooltip tooltipText="Delete form">
                                                <button
                                                    className="h-9 w-9 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        openDeleteModal(form.id, form.isAcceptingResponses)
                                                    }}
                                                    type="button"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </ButtonWithTooltip>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
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
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                messageModal.type === 'expired' 
                                    ? 'bg-orange-100' 
                                    : messageModal.type === 'error' 
                                        ? 'bg-red-100' 
                                        : 'bg-green-100'
                            }`}>
                                {messageModal.type === 'expired' ? (
                                    <Clock className="w-8 h-8 text-orange-600" />
                                ) : messageModal.type === 'error' ? (
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
                                className={`min-w-[120px] h-11 ${
                                    messageModal.type === 'expired'
                                        ? 'bg-orange-600 hover:bg-orange-700'
                                        : messageModal.type === 'error'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                Okay
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Validation Modal */}
            {publishValidationModal.isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closePublishValidationModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closePublishValidationModal}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        {/* Warning Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                            Can't publish yet
                        </h3>

                        {/* Message */}
                        <div className="text-gray-600 text-center mb-6">
                            <p className="mb-4 leading-relaxed">
                                Please complete the following before publishing:
                            </p>
                            <ul className="text-left space-y-2.5">
                                {publishValidationModal.missingFields.map((field, index) => (
                                    <li key={index} className="flex items-start gap-2 text-gray-700">
                                        <span className="text-gray-400 mt-[-1px]">-</span>
                                        <span>{field}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={closePublishValidationModal}
                                className="flex-1 h-11 text-gray-700 border-gray-300 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGoToEdit}
                                className="flex-1 h-11 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30"
                            >
                                Go to Edit
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
