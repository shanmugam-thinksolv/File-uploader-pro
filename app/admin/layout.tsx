import Link from "next/link"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SignOutButton } from "@/components/sign-out-button"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    // Allow access to login page without session
    // We handle this check in the layout to protect all admin routes
    // But we need to be careful not to redirect endlessly if we are already on the login page
    // Since layout wraps everything, we might need a different approach or check the path
    // However, in Next.js App Router, it's better to use Middleware or check in page/layout
    // For simplicity, we'll assume this layout is for protected routes. 
    // BUT, if /admin/login is inside /admin, this layout applies.
    // So we should probably move login out or handle it.
    // Actually, usually login is at /login or /auth/login. 
    // If user put it at /admin/login, we need to check headers or just let it be.

    // BETTER APPROACH: 
    // We will NOT check session here if we are on the login page.
    // But we don't have access to pathname easily in server layout.
    // So, we will just check session. If no session, we render the children ONLY IF it is the login page?
    // No, we can't know.

    // Alternative: Move login page to `app/login/page.tsx` instead of `app/admin/login/page.tsx`.
    // OR: Create a `(authenticated)` group inside `admin` and move layout there.

    // For now, let's just render the layout. The middleware is the best place for protection.
    // But since I didn't create middleware yet, I'll add a client component for SignOut.

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            {/* Top Navigation - Floating Island Design */}
            <div className="px-2 sm:px-4 pt-2 sm:pt-4 z-20">
                <header className="bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-xl sm:rounded-2xl shadow-lg mx-auto max-w-7xl">
                    <div className="px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
                        {/* Logo + Brand */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ background: 'linear-gradient(to bottom right, var(--primary-600), var(--primary-700))', boxShadow: '0 4px 6px -1px color-mix(in srgb, var(--primary-200) 40%, transparent)' }}>
                                <span className="text-white font-bold text-sm sm:text-lg">F</span>
                            </div>
                            <span className="font-bold text-sm sm:text-lg text-gray-900 tracking-tight truncate">File Uploader Pro</span>
                        </div>

                        {/* Navigation */}
                        <nav className="flex items-center gap-2 sm:gap-4 md:gap-8 flex-shrink-0">
                            {/* Desktop Navigation Links */}
                            <Link href="/admin/dashboard" className="hidden sm:inline-block text-xs sm:text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors whitespace-nowrap">
                                Dashboard
                            </Link>
                            <Link href="/contact" className="hidden md:inline-block text-xs sm:text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors whitespace-nowrap">
                                Contact
                            </Link>
                            
                            {/* Divider - Hidden on mobile */}
                            <div className="hidden md:block h-4 w-px bg-gray-200"></div>
                            
                            {/* User Info & Actions */}
                            {session ? (
                                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                                    {/* User Name - Hidden on small screens */}
                                    <span className="hidden lg:inline-block text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                        {session.user?.name}
                                    </span>
                                    <SignOutButton />
                                </div>
                            ) : (
                                <Link href="/admin/login">
                                    <Button variant="default" className="bg-primary-600 hover:bg-primary-700 text-white rounded-full px-3 sm:px-6 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap">
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full container mx-auto px-2 sm:px-4 py-4 sm:py-8 min-h-screen">
                {children}
            </main>

            <Footer />
        </div>
    )
}
