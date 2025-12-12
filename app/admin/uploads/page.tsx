"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Search, Loader2, ArrowLeft, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"

function UploadsContent() {
    const searchParams = useSearchParams()
    const formIdParam = searchParams.get('formId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [submissions, setSubmissions] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [forms, setForms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFormId, setSelectedFormId] = useState(formIdParam || 'all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchForms()
        fetchSubmissions(selectedFormId === 'all' ? null : selectedFormId)
    }, [selectedFormId])

    const fetchForms = async () => {
        try {
            const res = await fetch('/api/forms')
            if (!res.ok) {
                console.error('Failed to fetch forms:', res.statusText)
                setForms([])
                return
            }
            const data = await res.json()
            if (Array.isArray(data)) {
                setForms(data)
            } else {
                console.error('Fetched data is not an array:', data)
                setForms([])
            }
        } catch (error) {
            console.error('Failed to fetch forms', error)
            setForms([])
        }
    }

    const fetchSubmissions = async (formId: string | null) => {
        try {
            setLoading(true)
            const url = formId ? `/api/submissions?formId=${formId}` : '/api/submissions'
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) {
                setSubmissions(data)
            } else {
                setSubmissions([])
                console.error('Fetched data is not an array:', data)
            }
        } catch (error) {
            console.error('Failed to fetch submissions', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB'
    }

    const filteredSubmissions = submissions.filter(sub => {
        if (!searchQuery) return true
        return sub.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.submitterEmail.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const handleExportCSV = () => {
        const csvContent = [
            ['File Name', 'Uploader Name', 'Email', 'Form', 'Size', 'Date', 'File URL'].join(','),
            ...filteredSubmissions.map(sub => [
                sub.fileName,
                sub.submitterName,
                sub.submitterEmail,
                sub.form?.title || 'Unknown',
                formatSize(sub.fileSize),
                formatDate(sub.submittedAt),
                sub.fileUrl
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `uploads-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Uploads</h2>
                        <p className="text-muted-foreground">Manage files uploaded to your forms.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportCSV} disabled={filteredSubmissions.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-[200px]">
                            <select
                                value={selectedFormId}
                                onChange={(e) => setSelectedFormId(e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">All Forms</option>
                                {Array.isArray(forms) && forms.map(form => (
                                    <option key={form.id} value={form.id}>{form.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Uploads List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Uploads ({filteredSubmissions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                            <p className="text-muted-foreground">No uploads found</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">File Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">File Type</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Uploader</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Form</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Size</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {filteredSubmissions.map((submission) => (
                                            <tr key={submission.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-indigo-600" />
                                                        {submission.fileName}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className="text-sm text-muted-foreground">{submission.fileType || 'unknown'}</span>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{submission.submitterName}</span>
                                                        <span className="text-xs text-muted-foreground">{submission.submitterEmail}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <span className="text-sm">{submission.form?.title || 'Unknown'}</span>
                                                </td>
                                                <td className="p-4 align-middle">{formatSize(submission.fileSize)}</td>
                                                <td className="p-4 align-middle">{formatDate(submission.createdAt)}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function UploadsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <UploadsContent />
        </Suspense>
    )
}
