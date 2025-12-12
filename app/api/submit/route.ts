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

        // Normalize files array: If 'files' is provided, use it; otherwise create array from legacy fields
        let filesArray: Array<{ url: string; name: string; type: string; size: number }> = [];
        
        if (files && Array.isArray(files) && files.length > 0) {
            // Use the files array provided
            filesArray = files.map((f: any) => ({
                url: f.url || f.fileUrl || '',
                name: f.name || f.fileName || '',
                type: f.type || f.fileType || 'unknown',
                size: f.size || f.fileSize || 0
            }));
        } else if (fileUrl && fileName) {
            // Backward compatibility: Use legacy fields if files array is not provided
            filesArray = [{
                url: fileUrl,
                name: fileName,
                type: fileType || 'unknown',
                size: fileSize || 0
            }];
        }

        if (filesArray.length === 0) {
            console.error("No files provided in submission");
            return NextResponse.json(
                {
                    error: 'Missing file data',
                    details: 'No files provided in the submission'
                },
                { status: 400 }
            );
        }

        // Validate all files have required data
        for (const file of filesArray) {
            if (!file.url || !file.name) {
                console.error("Missing file data", file);
                return NextResponse.json(
                    {
                        error: 'Missing file data',
                        details: `File missing url or name: ${JSON.stringify(file)}`
                    },
                    { status: 400 }
                );
            }
        }

        // Create ONE submission record per file
        // This ensures each file appears as a separate row in the database
        const submissions = await Promise.all(
            filesArray.map((file) =>
                prisma.submission.create({
                    data: {
                        formId,
                        fileUrl: file.url,
                        fileName: file.name,
                        fileType: file.type || 'unknown',
                        fileSize: file.size || 0,
                        files: filesArray, // Store all files in JSON for reference
                        answers: answers || [],
                        submitterName,
                        submitterEmail,
                        metadata: metadata || {},
                    } as any,
                })
            )
        );

        // If metadata spreadsheet is enabled, append to spreadsheet (only once, not per file)
        if (form.enableMetadataSpreadsheet && form.userId) {
            try {
                // Format files array for spreadsheet
                const filesForSpreadsheet = filesArray.map((f) => ({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    url: f.url
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

        // Return the first submission (for backward compatibility)
        // All submissions are already created in the database
        return NextResponse.json(submissions[0], { status: 201 });
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
