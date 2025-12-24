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
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google' && user.email) {
                try {
                    // Check if user already exists by email
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                        include: { accounts: true }
                    });

                    if (existingUser) {
                        // User exists - check if Google account is linked
                        const googleAccount = existingUser.accounts.find(
                            acc => acc.provider === 'google' && acc.providerAccountId === account.providerAccountId
                        );

                        if (!googleAccount) {
                            // User exists but Google account not linked - create the link
                            // This prevents OAuthAccountNotLinked error
                            await prisma.account.create({
                                data: {
                                    userId: existingUser.id,
                                    type: account.type,
                                    provider: account.provider,
                                    providerAccountId: account.providerAccountId,
                                    refresh_token: account.refresh_token,
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    token_type: account.token_type,
                                    scope: account.scope,
                                    id_token: account.id_token,
                                    session_state: account.session_state,
                                }
                            });
                            console.log("Linked Google account to existing user:", user.email);
                            // Update user.id so PrismaAdapter knows to use existing user
                            user.id = existingUser.id;
                        } else {
                            // Update existing account tokens
                            await prisma.account.update({
                                where: { id: googleAccount.id },
                                data: {
                                    access_token: account.access_token,
                                    expires_at: account.expires_at,
                                    refresh_token: account.refresh_token || googleAccount.refresh_token,
                                    id_token: account.id_token,
                                }
                            });
                            user.id = existingUser.id;
                        }
                    }
                    // If user doesn't exist, PrismaAdapter will create it automatically
                } catch (error) {
                    console.error("Error in signIn callback:", error);
                    // Don't block sign-in - let PrismaAdapter handle it
                }
            }
            // Always return true to allow authentication
            return true;
        },
        async session({ session, token }) {
            // Ensure user ID is set from token
            if (session.user) {
                if (token.sub) {
                    session.user.id = token.sub
                } else {
                    // Fallback: try to get user ID from database if token.sub is missing
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { email: session.user.email || '' },
                            select: { id: true }
                        });
                        if (dbUser) {
                            session.user.id = dbUser.id;
                        }
                    } catch (error) {
                        console.error("Error fetching user ID for session:", error);
                    }
                }
            }
            if (token.accessToken) {
                (session as any).accessToken = token.accessToken
            }
            return session
        },
        async jwt({ token, account, user, profile }) {
            // Initial sign in - store user ID and account info
            if (account && user) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                
                // Try to get user ID - PrismaAdapter should set it, but handle fallback
                if (user.id) {
                    token.sub = user.id
                } else if (user.email) {
                    // If user.id is missing, try to get it from database
                    // This can happen if PrismaAdapter hasn't set it yet
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { email: user.email },
                            select: { id: true }
                        });
                        if (dbUser) {
                            token.sub = dbUser.id;
                            console.log("Found user ID from database:", dbUser.id, "for email:", user.email);
                        } else {
                            console.warn("User not found in database for email:", user.email, "- PrismaAdapter should create it");
                        }
                    } catch (error) {
                        console.error("Error fetching user ID in JWT callback:", error);
                    }
                } else {
                    console.error("No user ID or email available in JWT callback");
                }
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
        error: '/admin/login',
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
