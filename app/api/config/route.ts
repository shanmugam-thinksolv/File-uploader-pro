import { NextResponse } from 'next/server'

// Mock Data Store (in memory for now, would be DB in real app)
let config = {
    id: "ref-123",
    name: "General Upload Form",
    description: "Please upload your project files here. Supported formats: PDF, PNG, JPG.",
    // No file size limit - users can upload any size
    allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
    isPasswordProtected: true,
    password: "password123", // Mock password
    isCaptchaEnabled: false,
    enableSubmitAnother: true,
    design: {
        primaryColor: "#4f46e5",
        backgroundColor: "#ffffff",
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
