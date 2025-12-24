import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from './prisma'

export async function getDriveClient(userId: string) {
    // Get the user's account with access token
    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: 'google'
        },
        select: {
            access_token: true,
            refresh_token: true,
            expires_at: true
        }
    })

    if (!account || !account.access_token) {
        throw new Error('User not authenticated with Google')
    }

    if (!account.refresh_token) {
        console.warn('Google Drive: Missing refresh token for user', userId);
        // We can still try with access token, but if it's expired, it will fail.
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined
    })

    // Handle token refresh events to update the database (optional but good practice)
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await prisma.account.updateMany({
                where: { userId: userId, provider: 'google' },
                data: {
                    access_token: tokens.access_token,
                    expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
                    refresh_token: tokens.refresh_token || undefined // Only update if new one provided
                }
            });
        }
    });

    return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function uploadToDrive(
    file: Buffer,
    fileName: string,
    mimeType: string
): Promise<string> {
    const session = await getServerSession(authOptions)

    if (!session || !(session as any).accessToken) {
        throw new Error('Not authenticated')
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
        access_token: (session as any).accessToken,
    })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            mimeType: mimeType,
        },
        media: {
            mimeType: mimeType,
            body: Buffer.from(file),
        },
        fields: 'id, webViewLink',
    })

    return response.data.webViewLink || ''
}

export async function listDriveFolders(): Promise<any[]> {
    const session = await getServerSession(authOptions)

    if (!session || !(session as any).accessToken) {
        throw new Error('Not authenticated')
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
        access_token: (session as any).accessToken,
    })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc',
        pageSize: 100,
    })

    return response.data.files || []
}
