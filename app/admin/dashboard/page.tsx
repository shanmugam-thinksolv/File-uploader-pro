"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Plus, FileText, Loader2, ExternalLink } from "lucide-react"

export default function AdminDashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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

    const handleDelete = async (formId: string) => {
        if (!confirm('Are you sure you want to delete this form?')) return

        try {
            const res = await fetch(`/api/forms/${formId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setForms(forms.filter(f => f.id !== formId))
            } else {
                alert('Failed to delete form')
            }
        } catch (error) {
            console.error('Failed to delete form', error)
            alert('Failed to delete form')
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
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-base font-semibold text-gray-900">{form.title}</h3>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {form.isAcceptingResponses ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-sm text-gray-400">•</span>
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 px-4"
                                    onClick={() => handleDelete(form.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
