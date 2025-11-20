import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            formId,
            fileUrl,
            fileName,
            fileType,
            fileSize,
            submitterName,
            submitterEmail,
            metadata
        } = body;

        if (!formId || !fileUrl || !fileName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const submission = await prisma.submission.create({
            data: {
                formId,
                fileUrl,
                fileName,
                fileType: fileType || 'unknown',
                fileSize: fileSize || 0,
                submitterName,
                submitterEmail,
                metadata: metadata || {},
            },
        });

        return NextResponse.json(submission, { status: 201 });
    } catch (error) {
        console.error('Error submitting form:', error);
        return NextResponse.json(
            { error: 'Failed to submit form' },
            { status: 500 }
        );
    }
}
