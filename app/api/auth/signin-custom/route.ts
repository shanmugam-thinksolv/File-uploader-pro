import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('mode') // 'signin' or 'signup'
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`

    // Build Google OAuth URL
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
        access_type: 'offline',
        // Use consent for signup, select_account for signin
        prompt: mode === 'signup' ? 'consent' : 'select_account',
        state: Buffer.from(JSON.stringify({ callbackUrl })).toString('base64')
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.redirect(authUrl)
}
