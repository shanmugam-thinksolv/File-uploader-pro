import { NextResponse } from 'next/server'

// Mock Data Store (in memory for now, would be DB in real app)
let config = {
    maxSizeMB: 5,
    allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    isPasswordProtected: false,
    password: "admin",
    isCaptchaEnabled: false,
    enableSubmitAnother: true,
    design: {
        primaryColor: "#000000",
        backgroundColor: "#f3f4f6",
        fontFamily: "Inter",
        logoUrl: null
    }
}

export async function GET() {
    return NextResponse.json(config)
}

export async function POST(request: Request) {
    const body = await request.json()
    config = { ...config, ...body }
    return NextResponse.json({ success: true, config })
}
