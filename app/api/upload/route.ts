import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    // In a real app, we would parse the FormData here
    // const formData = await request.formData()
    // const file = formData.get('file')

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate Reference ID
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const random = Math.floor(1000 + Math.random() * 9000)
    const referenceId = `${date}-${random}`

    return NextResponse.json({
        success: true,
        referenceId,
        message: "File uploaded successfully"
    })
}
