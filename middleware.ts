import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname
    
    // Allow NextAuth API routes and OAuth callbacks to pass through
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next()
    }

    const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token.v2'
    })

    const isAuth = !!token
    const isAuthPage = pathname.startsWith("/admin/login")
    const isAdminPage = pathname.startsWith("/admin") && !isAuthPage

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Middleware] Path: ${pathname}, Has Token: ${isAuth}, Token Sub: ${token?.sub || 'none'}`)
    }

    // If user is authenticated and trying to access login page, redirect to dashboard
    if (isAuthPage && isAuth) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
    }

    // If user is not authenticated and trying to access admin pages, redirect to login
    if (isAdminPage && !isAuth) {
        const loginUrl = new URL("/admin/login", req.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

// Specify which routes this middleware should run on
export const config = {
    matcher: ["/admin/:path*"]
}