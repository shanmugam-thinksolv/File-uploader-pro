import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${uuidv4()}-${file.name}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads');
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        // Return the URL relative to the public folder
        const fileUrl = `/uploads/${fileName}`;

        return NextResponse.json({
            url: fileUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
