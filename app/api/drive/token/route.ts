import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json(
                { error: 'Not authenticated. Please sign in with Google.' },
                { status: 401 }
            );
        }

        // Get the account from database to check for refresh token
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                provider: 'google'
            },
            select: {
                access_token: true,
                refresh_token: true,
                expires_at: true
            }
        });

        if (!account || !account.access_token) {
            return NextResponse.json(
                { 
                    error: 'No Google account found. Please sign out and sign in again with Google.',
                    requiresReauth: true
                },
                { status: 401 }
            );
        }

        // Check if token is expired or will expire soon (within 5 minutes)
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = account.expires_at || 0;
        const isExpired = expiresAt < now;
        const expiresSoon = expiresAt < (now + 300); // 5 minutes

        // If expired or expires soon, try to refresh
        if ((isExpired || expiresSoon) && account.refresh_token) {
            try {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );

                oauth2Client.setCredentials({
                    refresh_token: account.refresh_token
                });

                const { credentials } = await oauth2Client.refreshAccessToken();
                
                // Update database with new token
                await prisma.account.updateMany({
                    where: {
                        userId: session.user.id,
                        provider: 'google'
                    },
                    data: {
                        access_token: credentials.access_token,
                        expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
                        refresh_token: credentials.refresh_token || account.refresh_token
                    }
                });

                return NextResponse.json({ 
                    accessToken: credentials.access_token,
                    refreshed: true
                });
            } catch (refreshError: any) {
                console.error('Token refresh failed:', refreshError);
                return NextResponse.json(
                    { 
                        error: 'Token expired and refresh failed. Please sign out and sign in again.',
                        requiresReauth: true,
                        details: refreshError.message
                    },
                    { status: 401 }
                );
            }
        }

        // Use existing token
        return NextResponse.json({ 
            accessToken: account.access_token,
            expiresAt: account.expires_at
        });
    } catch (error: any) {
        console.error('Error getting access token:', error);
        return NextResponse.json(
            { 
                error: 'Failed to get access token',
                details: error.message,
                requiresReauth: true
            },
            { status: 500 }
        );
    }
}
