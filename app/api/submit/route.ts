import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appendSubmissionToSpreadsheet } from '@/lib/google-sheets';
import { syncFilesToResponseSheet } from '@/lib/google-sheets-sync';
import { Prisma } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        // Use raw SQL to ensure all fields are retrieved correctly, 
        // especially allowedDomains which might be missing in Prisma client types.
        const forms = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "Form" WHERE id = $1 LIMIT 1`,
            formId
        );
        const form = forms[0];
        
        // Handle field casing from raw SQL (PostgreSQL might return lowercase)
        const getField = (obj: any, field: string) => obj[field] !== undefined ? obj[field] : obj[field.toLowerCase()];

        // Extract needed fields with defaults
        const formData = {
            userId: getField(form, 'userId'),
            title: getField(form, 'title'),
            enableMetadataSpreadsheet: getField(form, 'enableMetadataSpreadsheet') ?? false,
            enableResponseSheet: getField(form, 'enableResponseSheet') ?? false,
            responseSheetId: getField(form, 'responseSheetId'),
            driveFolderId: getField(form, 'driveFolderId'),
            expiryDate: getField(form, 'expiryDate'),
            isAcceptingResponses: getField(form, 'isAcceptingResponses'),
            uploadFields: getField(form, 'uploadFields'),
            customQuestions: getField(form, 'customQuestions'),
            isPasswordProtected: getField(form, 'isPasswordProtected') ?? false,
            password: getField(form, 'password'),
            accessLevel: getField(form, 'accessLevel'),
            allowedDomains: getField(form, 'allowedDomains')
        };

        if (!form || !formData.userId) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }

        // SECURITY: Check Google Sign-In restriction
        if (formData.accessLevel === 'INVITED') {
            const session = await getServerSession(authOptions);
            if (!session || !session.user || !session.user.email) {
                return NextResponse.json({ 
                    error: 'Authentication Required', 
                    details: 'This form requires Google Sign-In.' 
                }, { status: 401 });
            }

            // Check domain if configured
            const allowedDomains = formData.allowedDomains 
                ? formData.allowedDomains.split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean)
                : [];
            
            if (allowedDomains.length > 0) {
                const userEmail = session.user.email.toLowerCase();
                const userDomain = userEmail.split('@')[1];
                if (!userDomain || !allowedDomains.includes(userDomain)) {
                    return NextResponse.json({ 
                        error: 'Access Denied', 
                        details: 'Your email domain is not authorized to submit to this form.' 
                    }, { status: 403 });
                }
            }

            // OVERRIDE: Use guaranteed identity from Google session
            body.submitterEmail = session.user.email;
            body.submitterName = session.user.name;
        }
        
        // Use identity from body (which may have been overridden by session above)
        const finalSubmitterEmail = body.submitterEmail;
        const finalSubmitterName = body.submitterName;

        // SECURITY: Check password protection (if enabled)
        if (formData.isPasswordProtected && formData.password) {
            // Password should be sent in the request body
            const submittedPassword = body.password;
            if (!submittedPassword || submittedPassword !== formData.password) {
                return NextResponse.json(
                    { 
                        error: 'Invalid password',
                        details: 'The password you entered is incorrect.'
                    },
                    { status: 401 }
                );
            }
        }

        // SECURITY: Check if form is accepting responses
        if (!formData.isAcceptingResponses) {
            return NextResponse.json(
                { error: 'Form is not accepting responses' },
                { status: 403 }
            );
        }

        // Check if form has expired
        if (formData.expiryDate) {
            const expiryDate = new Date(formData.expiryDate);
            const now = new Date();
            if (now > expiryDate) {
                return NextResponse.json(
                    {
                        error: 'Form expired',
                        message: 'This form is no longer accepting submissions.',
                        expiryDate: formData.expiryDate
                    },
                    { status: 410 } // 410 Gone
                );
            }
        }

        // Normalize files array: If 'files' is provided, use it; otherwise create array from legacy fields
        let filesArray: Array<{ 
            url: string; 
            name: string; 
            type: string; 
            size: number; 
            fieldId?: string; 
            label?: string;
            isFromFolder?: boolean;
            folderName?: string;
            relativePath?: string;
        }> = [];

        if (files && Array.isArray(files) && files.length > 0) {
            // Use the files array provided - preserve all metadata for response sheet
            filesArray = files.map((f: any) => ({
                url: f.url || f.fileUrl || '',
                name: f.name || f.fileName || '',
                type: f.type || f.fileType || 'unknown',
                size: f.size || f.fileSize || 0,
                fieldId: f.fieldId, // Preserve fieldId for response sheet matching
                label: f.label, // Preserve label for response sheet matching
                isFromFolder: f.isFromFolder || false,
                folderName: f.folderName || undefined,
                relativePath: f.relativePath || undefined
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
        let submissions;
        try {
            submissions = await Promise.all(
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
                        submitterName: finalSubmitterName,
                        submitterEmail: finalSubmitterEmail,
                        metadata: metadata || {},
                    } as any,
                })
            )
        );
        } catch (createError: any) {
            // Handle PostgreSQL prepared statement errors (connection pooling issue)
            if (createError.message?.includes('prepared statement') || 
                createError.code === '26000' || 
                createError.message?.includes('26000')) {
                console.error('[Submit] Connection error, retrying with single transaction...');
                
                // Retry with a single transaction to force connection refresh
                submissions = [];
                for (const file of filesArray) {
                    try {
                        const sub = await prisma.submission.create({
                            data: {
                                formId,
                                fileUrl: file.url,
                                fileName: file.name,
                                fileType: file.type || 'unknown',
                                fileSize: file.size || 0,
                                files: filesArray,
                                answers: answers || [],
                                submitterName: finalSubmitterName,
                                submitterEmail: finalSubmitterEmail,
                                metadata: metadata || {},
                            } as any,
                        });
                        submissions.push(sub);
                    } catch (retryError) {
                        console.error('[Submit] Retry failed for file:', file.name, retryError);
                        throw retryError;
                    }
                }
            } else {
                throw createError;
            }
        }

        // If response sheet is enabled, sync files to response sheet
        if (formData.enableResponseSheet && formData.userId) {
            try {
                console.log('[Submit] Response sheet enabled, preparing to sync...');
                
                // Parse upload fields to get field labels
                let uploadFields: Array<{ id: string; label: string }> = [];
                if (formData.uploadFields) {
                    try {
                        uploadFields = typeof formData.uploadFields === 'string' 
                            ? JSON.parse(formData.uploadFields) 
                            : formData.uploadFields;
                        console.log('[Submit] Parsed upload fields:', uploadFields);
                    } catch (parseError) {
                        console.error('[Submit] Error parsing uploadFields:', parseError);
                        uploadFields = [];
                    }
                }

                // Prepare files with field labels
                const filesForSync = filesArray.map((file) => {
                    const field = uploadFields.find(f => f.id === file.fieldId);
                    const uploadType = file.isFromFolder ? 'folder' : 'file';
                    const relativePath = file.relativePath || file.name;
                    
                    return {
                        url: file.url,
                        name: file.name,
                        size: file.size,
                        fieldId: file.fieldId,
                        fieldLabel: field?.label || file.label || 'Unknown',
                        uploadType: uploadType as 'file' | 'folder',
                        folderName: file.folderName || '',
                        relativePath: relativePath
                    };
                });

                console.log('[Submit] Files prepared for sync:', filesForSync);

                const firstSubmissionId = submissions[0]?.id || '';
                
                if (!firstSubmissionId) {
                    console.error('[Submit] No submission ID available for response sheet sync');
                } else if (filesForSync.length === 0) {
                    console.error('[Submit] No files to sync to response sheet');
                } else {
                    const spreadsheetId = await syncFilesToResponseSheet(
                        formData.userId,
                        formId,
                        formData.title || 'Untitled Form',
                        firstSubmissionId,
                        {
                            timestamp: new Date().toISOString(),
                            submitterEmail: finalSubmitterEmail || null,
                            files: filesForSync
                        }
                    );

                    console.log(`[Submit] Successfully synced ${filesForSync.length} file(s) to response sheet: ${spreadsheetId}`);
                }
            } catch (syncError: any) {
                // Log error but don't fail the submission
                console.error('[Submit] Failed to sync to response sheet:', syncError);
                console.error('[Submit] Error details:', {
                    message: syncError.message,
                    code: syncError.code,
                    stack: syncError.stack
                });
                
                if (syncError.message?.includes('PERMISSION_ERROR')) {
                    console.error('[Submit] Response sheet permission error - user may need to reconnect Google account');
                }
            }
        }

        // If metadata spreadsheet is enabled, append to spreadsheet (only once, not per file)
        if (formData.enableMetadataSpreadsheet && formData.userId) {
            try {
                // Format files array for spreadsheet
                const filesForSpreadsheet = filesArray.map((f) => ({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    url: f.url
                }));

                await appendSubmissionToSpreadsheet(
                    formData.userId,
                    formId,
                    formData.title,
                    formData.driveFolderId,
                    {
                        timestamp: new Date().toISOString(),
                        submitterName: finalSubmitterName || null,
                        submitterEmail: finalSubmitterEmail || null,
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
