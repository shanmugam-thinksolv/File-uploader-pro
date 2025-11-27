import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file",
                    // Default to select_account, but can be overridden
                    prompt: "select_account"
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
            }
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken
            }
            return session
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            // If url starts with "/", it's a relative callback URL
            if (url.startsWith("/")) return `${baseUrl}${url}`

            // If url has the same origin as baseUrl, extract the path
            if (new URL(url).origin === baseUrl) {
                const urlPath = new URL(url).pathname
                const searchParams = new URL(url).searchParams
                const callbackUrl = searchParams.get('callbackUrl')

                // If there's a callbackUrl in the query params, use it
                if (callbackUrl && callbackUrl.startsWith('/')) {
                    return `${baseUrl}${callbackUrl}`
                }

                return url
            }

            // Default to dashboard for authenticated users instead of home page
            return `${baseUrl}/admin/dashboard`
        },
    },
    pages: {
        signIn: '/admin/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: `next-auth.session-token.v2`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        }
    }
}
