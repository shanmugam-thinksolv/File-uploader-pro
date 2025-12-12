import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

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
                    // Changed from drive.file to drive to allow Picker to list all folders
                    scope: "openid email profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets",
                    // Default to select_account, but can be overridden
                    prompt: "consent"
                }
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                try {
                    // Manually update the account tokens to ensure we capture the refresh token
                    // This is sometimes needed if the adapter doesn't update on re-login
                    const existingAccount = await prisma.account.findFirst({
                        where: {
                            userId: user.id,
                            provider: 'google'
                        }
                    });

                    if (existingAccount) {
                        await prisma.account.update({
                            where: { id: existingAccount.id },
                            data: {
                                access_token: account.access_token,
                                expires_at: account.expires_at,
                                refresh_token: account.refresh_token || existingAccount.refresh_token, // Keep existing if new one is null
                                id_token: account.id_token,
                            }
                        });
                    }
                } catch (error) {
                    console.error("Error updating Google account tokens:", error);
                }
            }
            return true;
        },
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
