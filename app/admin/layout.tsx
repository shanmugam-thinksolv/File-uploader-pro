import { LayoutDashboard, Settings, Palette, Share2, LogOut } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md bg-primary/10 text-primary"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/admin/dashboard?tab=design"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Palette className="w-5 h-5" />
                        Design
                    </Link>
                    <Link
                        href="/admin/dashboard?tab=publishing"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Share2 className="w-5 h-5" />
                        Publishing
                    </Link>
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/admin/login"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
