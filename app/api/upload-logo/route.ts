import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('logo') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG, JPG, and SVG are allowed' },
                { status: 400 }
            )
        }

        // Validate file size (2MB limit)
        const maxSize = 2 * 1024 * 1024 // 2MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 2MB' },
                { status: 400 }
            )
        }

        // Create logos directory if it doesn't exist
        const logosDir = path.join(process.cwd(), 'public', 'logos')
        try {
            await mkdir(logosDir, { recursive: true })
        } catch {
            // Directory might already exist
        }

        // Generate unique filename
        const ext = path.extname(file.name)
        const filename = `${crypto.randomUUID()}${ext}`
        const filepath = path.join(logosDir, filename)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filepath, buffer)

        // Return URL path
        const url = `/logos/${filename}`

        return NextResponse.json({
            url,
            filename,
            size: file.size,
            type: file.type
        })
    } catch (error) {
        console.error('Logo upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload logo' },
            { status: 500 }
        )
    }
}
