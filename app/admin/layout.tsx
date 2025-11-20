import Link from "next/link"
import { LogOut } from "lucide-react"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            {/* Top Navigation - Floating Island Design */}
            <div className="px-4 pt-4 z-20">
                <header className="bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-lg mx-auto max-w-7xl">
                    <div className="px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-md">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            <span className="font-bold text-lg text-gray-900 tracking-tight">File Uploader Pro</span>
                        </div>

                        <nav className="flex items-center gap-8">
                            <Link href="/admin/dashboard" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                                Contact
                            </Link>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                                Let&apos;s Connect
                            </Button>
                            <Link href="/admin/login" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 ml-2">
                                <LogOut className="w-4 h-4" />
                            </Link>
                        </nav>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full container mx-auto px-4 py-8 min-h-screen">
                {children}
            </main>

            <Footer />
        </div>
    )
}
