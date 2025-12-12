import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendSubmissionToSpreadsheet } from '@/lib/google-sheets';

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

        if (!formId) {
            console.error("Missing form ID");
            return NextResponse.json(
                { error: 'Missing form ID' },
                { status: 400 }
            );
        }

        // Fetch form to check if metadata spreadsheet is enabled and if form has expired
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: {
                userId: true,
                title: true,
                enableMetadataSpreadsheet: true,
                driveFolderId: true,
                expiryDate: true,
                isAcceptingResponses: true
            }
        });

        if (!form) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // Check if form is accepting responses
        if (!form.isAcceptingResponses) {
            return NextResponse.json(
                { error: 'Form is not accepting responses' },
                { status: 403 }
            );
        }

        // Check if form has expired
        if (form.expiryDate) {
            const expiryDate = new Date(form.expiryDate);
            const now = new Date();
            if (now > expiryDate) {
                return NextResponse.json(
                    { 
                        error: 'Form expired',
                        message: 'This form is no longer accepting submissions.',
                        expiryDate: form.expiryDate
                    },
                    { status: 410 } // 410 Gone
                );
            }
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

        // Create submission record
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

        // If metadata spreadsheet is enabled, append to spreadsheet
        if (form.enableMetadataSpreadsheet && form.userId) {
            try {
                // Format files array for spreadsheet
                const filesForSpreadsheet = (files || [primaryFile]).map((f: any) => ({
                    name: f.name || f.fileName || '',
                    type: f.type || f.fileType || '',
                    size: f.size || f.fileSize || 0,
                    url: f.url || f.fileUrl || ''
                }));

                await appendSubmissionToSpreadsheet(
                    form.userId,
                    formId,
                    form.title,
                    form.driveFolderId,
                    {
                        timestamp: new Date().toISOString(),
                        submitterName: submitterName || null,
                        submitterEmail: submitterEmail || null,
                        files: filesForSpreadsheet,
                        answers: answers || [],
                        metadata: metadata || {}
                    }
                );
            } catch (spreadsheetError) {
                // Log error but don't fail the submission
                console.error('Failed to update metadata spreadsheet:', spreadsheetError);
            }
        }

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
