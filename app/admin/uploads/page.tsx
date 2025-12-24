"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Search, Loader2, ArrowLeft, ExternalLink, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    const [exportLoading, setExportLoading] = useState(false)

    // Fetch forms once on mount
    useEffect(() => {
        fetchForms()
    }, [])
    
    // Fetch submissions when selectedFormId changes
    useEffect(() => {
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

            // If the API failed, log once and fall back to empty list
            if (!res.ok) {
                console.error('Failed to fetch submissions:', res.status, res.statusText)
                setSubmissions([])
                return
            }

            const data = await res.json()

            // Support both raw array and `{ submissions: [...] }` shapes just in case
            const submissionsData = Array.isArray(data)
                ? data
                : Array.isArray((data as any)?.submissions)
                    ? (data as any).submissions
                    : []

            if (!Array.isArray(submissionsData)) {
                // Final safety net – don't spam console with the whole object
                console.error('Submissions API returned unexpected shape, treating as empty list')
                setSubmissions([])
            } else {
                setSubmissions(submissionsData)
            }
        } catch (error) {
            console.error('Failed to fetch submissions', error)
            setSubmissions([])
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

    const handleExportGoogleSheet = async () => {
        if (filteredSubmissions.length === 0) {
            alert('No submissions to export')
            return
        }

        setExportLoading(true)
        try {
            const formId = selectedFormId !== 'all' ? selectedFormId : null
            const res = await fetch('/api/export/google-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formId,
                    submissions: filteredSubmissions.map(sub => ({
                        fileName: sub.fileName,
                        submitterName: sub.submitterName,
                        submitterEmail: sub.submitterEmail,
                        formTitle: sub.form?.title || 'Unknown',
                        fileSize: sub.fileSize,
                        submittedAt: sub.submittedAt,
                        fileUrl: sub.fileUrl
                    }))
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to export to Google Sheet')
            }

            const data = await res.json()
            if (data.sheetUrl) {
                window.open(data.sheetUrl, '_blank')
            } else {
                alert('Google Sheet created successfully!')
            }
        } catch (error: any) {
            console.error('Export error:', error)
            alert(error.message || 'Failed to export to Google Sheet. Please try again.')
        } finally {
            setExportLoading(false)
        }
    }

    const handleExport = (format: 'csv' | 'google-sheet') => {
        if (format === 'csv') {
            handleExportCSV()
        } else {
            handleExportGoogleSheet()
        }
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Uploads</h2>
                        <p className="hidden sm:block text-muted-foreground">Manage files uploaded to your forms.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                        value={exportLoading ? "" : undefined}
                        onValueChange={(value) => {
                            if (value === 'csv' || value === 'google-sheet') {
                                handleExport(value)
                            }
                        }}
                        disabled={filteredSubmissions.length === 0 || exportLoading}
                    >
                        <SelectTrigger className="w-full sm:w-[150px] h-10">
                            <Download className="w-4 h-4 mr-2" />
                            <SelectValue placeholder={exportLoading ? "Exporting..." : "Export"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="csv">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Export as CSV
                                </div>
                            </SelectItem>
                            <SelectItem value="google-sheet">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Export to Google Sheet
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-0 sm:border shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="w-full sm:w-[180px]">
                            <select
                                value={selectedFormId}
                                onChange={(e) => setSelectedFormId(e.target.value)}
                                className="flex h-11 sm:h-10 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                            >
                                <option value="all">All Forms</option>
                                {Array.isArray(forms) && forms.map(form => (
                                    <option key={form.id} value={form.id}>{form.title}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files, uploaders..."
                                className="pl-10 h-11 sm:h-10 rounded-xl bg-gray-50/50 focus:bg-white transition-all border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Uploads List */}
            <Card className="border-0 sm:border shadow-sm overflow-hidden">
                <CardHeader className="px-4 py-4 sm:px-6 bg-gray-50/50 border-b">
                    <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                        {loading ? 'Loading...' : `Recent Uploads (${filteredSubmissions.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-0">
                    {loading ? (
                        <div className="flex justify-center items-center min-h-[300px]">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="text-center py-20 border border-dashed rounded-lg mx-4 my-6">
                            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">No uploads found</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View: Card List */}
                            <div className="block sm:hidden divide-y divide-gray-100">
                                {filteredSubmissions.map((submission) => (
                                    <div key={submission.id} className="p-4 bg-white active:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-gray-900 truncate pr-2">{submission.fileName}</h4>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                                                        {submission.fileType || 'file'} • {formatSize(submission.fileSize)}
                                                    </p>
                                                </div>
                                            </div>
                                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white shadow-sm">
                                                    <ExternalLink className="w-4 h-4 text-primary-600" />
                                                </Button>
                                            </a>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">Uploader</span>
                                                <span className="text-gray-900 font-bold">{submission.submitterName}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">Form</span>
                                                <span className="text-gray-900 font-bold truncate max-w-[150px]">{submission.form?.title || 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-medium">Date</span>
                                                <span className="text-gray-900 font-bold">{formatDate(submission.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden sm:block">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="bg-gray-50/50">
                                            <tr className="border-b transition-colors hover:bg-muted/50">
                                                <th className="h-12 px-6 text-left align-middle font-bold text-gray-700 uppercase tracking-wider text-[11px]">File Name</th>
                                                <th className="h-12 px-6 text-left align-middle font-bold text-gray-700 uppercase tracking-wider text-[11px]">Uploader</th>
                                                <th className="h-12 px-6 text-left align-middle font-bold text-gray-700 uppercase tracking-wider text-[11px]">Form</th>
                                                <th className="h-12 px-6 text-left align-middle font-bold text-gray-700 uppercase tracking-wider text-[11px]">Size</th>
                                                <th className="h-12 px-6 text-left align-middle font-bold text-gray-700 uppercase tracking-wider text-[11px]">Date</th>
                                                <th className="h-12 px-6 text-right align-middle font-bold text-gray-700 uppercase tracking-wider text-[11px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredSubmissions.map((submission) => (
                                                <tr key={submission.id} className="transition-colors hover:bg-gray-50/80">
                                                    <td className="px-6 py-4 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-primary-50 flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-primary-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 truncate max-w-[200px]">{submission.fileName}</p>
                                                                <p className="text-[10px] text-gray-400 font-medium">{submission.fileType || 'unknown'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 text-sm">{submission.submitterName}</span>
                                                            <span className="text-xs text-gray-400">{submission.submitterEmail}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle">
                                                        <span className="text-sm font-semibold text-gray-700">{submission.form?.title || 'Unknown'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 align-middle font-medium text-gray-500">{formatSize(submission.fileSize)}</td>
                                                    <td className="px-6 py-4 align-middle text-gray-500">{formatDate(submission.createdAt)}</td>
                                                    <td className="px-6 py-4 align-middle text-right">
                                                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors">
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
                        </>
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
