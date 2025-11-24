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
            files, // Array of {url, name, type, size, fieldId, label}
            answers, // Array of {questionId, answer}
            submitterName,
            submitterEmail,
            metadata
        } = body;

        console.log("Submit API received body:", body);

        if (!formId) {
            console.error("Missing form ID");
            return NextResponse.json(
                { error: 'Missing form ID' },
                { status: 400 }
            );
        }

        // Backward compatibility: If 'files' is provided, use the first file for the legacy fields
        // If 'files' is NOT provided, use the legacy fields (fileUrl, etc.)
        let primaryFile = {
            url: fileUrl,
            name: fileName,
            type: fileType,
            size: fileSize
        };

        if (files && Array.isArray(files) && files.length > 0) {
            const firstFile = files[0];
            primaryFile = {
                url: firstFile.url,
                name: firstFile.name || firstFile.fileName,
                type: firstFile.type || firstFile.fileType,
                size: firstFile.size || firstFile.fileSize
            };
        }

        console.log("Primary File extracted:", primaryFile);

        if (!primaryFile.url || !primaryFile.name) {
            console.error("Missing file data for primary file", primaryFile);
            return NextResponse.json(
                {
                    error: 'Missing file data',
                    details: primaryFile
                },
                { status: 400 }
            );
        }

        const submission = await prisma.submission.create({
            data: {
                formId,
                fileUrl: primaryFile.url,
                fileName: primaryFile.name,
                fileType: primaryFile.type || 'unknown',
                fileSize: primaryFile.size || 0,
                files: files || [primaryFile], // Ensure files is always populated
                answers: answers || [],
                submitterName,
                submitterEmail,
                metadata: metadata || {},
            } as any,
        });

        return NextResponse.json(submission, { status: 201 });
    } catch (error: any) {
        console.error('Error submitting form:', error);
        return NextResponse.json(
            {
                error: 'Failed to submit form',
                details: error.message || String(error)
            },
            { status: 500 }
        );
    }
}
