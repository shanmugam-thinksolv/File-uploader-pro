
import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const formId = formData.get('formId') as string;
        const fieldId = formData.get('fieldId') as string | null;
        const submissionId = formData.get('submissionId') as string | null; // For per-submission folders
        const folderName = formData.get('folderName') as string | null; // Actual folder name for folder uploads
        const relativePath = formData.get('relativePath') as string | null; // Relative path for folder uploads (e.g., "New folder/extra/file.jpg")

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!formId) {
            return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
        }

        // Find the form to get the owner and validate access
        // Use raw SQL to ensure all fields are retrieved correctly, 
        // especially allowedDomains which might be missing in Prisma client types.
        const forms = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "Form" WHERE id = $1 LIMIT 1`,
            formId
        );
        const form = forms[0];

        if (!form || !form.userId) {
            return NextResponse.json({ error: 'Form not found or has no owner' }, { status: 404 });
        }

        // Handle field casing from raw SQL (PostgreSQL might return lowercase)
        const accessLevel = form.accessLevel || form.accesslevel;
        const allowedDomainsRaw = form.allowedDomains || form.alloweddomains || "";

        // SECURITY: Check Google Sign-In restriction
        if (accessLevel === 'INVITED') {
            const session = await getServerSession(authOptions);
            if (!session || !session.user || !session.user.email) {
                return NextResponse.json({ 
                    error: 'Authentication Required', 
                    details: 'This form requires Google Sign-In.' 
                }, { status: 401 });
            }

            // Check domain if configured
            const allowedDomains = allowedDomainsRaw 
                ? allowedDomainsRaw.split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean)
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
        }

        // SECURITY: Check if form is accepting responses
        if (!form.isAcceptingResponses) {
            return NextResponse.json({ 
                error: 'Form is not accepting responses',
                details: 'This form has been closed by the administrator.'
            }, { status: 403 });
        }

        // SECURITY: Check if form has expired
        if (form.expiryDate) {
            const expiryDate = new Date(form.expiryDate);
            const now = new Date();
            if (now > expiryDate) {
                return NextResponse.json({ 
                    error: 'Form expired',
                    details: 'This form is no longer accepting submissions.',
                    expiryDate: form.expiryDate
                }, { status: 410 }); // 410 Gone
            }
        }

        // SECURITY: Check password protection (if enabled)
        if (form.isPasswordProtected && form.password) {
            const submittedPassword = formData.get('password') as string;
            if (!submittedPassword || submittedPassword !== form.password) {
                return NextResponse.json({ 
                    error: 'Invalid password',
                    details: 'The password you entered is incorrect.'
                }, { status: 401 });
            }
        }

        // Convert File to Stream
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        // Get Drive Client for the form owner
        const drive = await getDriveClient(form.userId);

        // Extract filename from path (for folder uploads, file.name might include path)
        // If relativePath is provided, use it to get the actual filename (last part)
        // Otherwise, use file.name directly
        let originalFileName = file.name || 'unnamed_file';
        if (relativePath) {
            // Extract just the filename from the relative path
            const pathParts = relativePath.split('/');
            originalFileName = pathParts[pathParts.length - 1] || file.name || 'unnamed_file';
        } else if (file.name && file.name.includes('/')) {
            // Fallback: if file.name contains path but no relativePath was sent, extract filename
            const pathParts = file.name.split('/');
            originalFileName = pathParts[pathParts.length - 1] || 'unnamed_file';
        }

        // Prepare metadata
        const fileMetadata: any = {
            name: originalFileName, // Use just the filename (no path)
            mimeType: file.type,
        };

        // Determine the root parent (either specific folder or root)
        const rootParentId = form.driveFolderId || null;

        // Ensure "File Uploader Pro" folder exists inside the root parent
        let baseUploaderFolderId = rootParentId;

        // Search for "File Uploader Pro" folder
        const q = `name = 'File Uploader Pro' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${rootParentId ? ` and '${rootParentId}' in parents` : ''}`;

        const folderResponse = await drive.files.list({
            q: q,
            fields: 'files(id)',
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (folderResponse.data.files && folderResponse.data.files.length > 0) {
            // Folder exists
            baseUploaderFolderId = folderResponse.data.files[0].id!;
        } else {
            // Create folder
            const folderMetadata: any = {
                name: 'File Uploader Pro',
                mimeType: 'application/vnd.google-apps.folder',
            };
            if (rootParentId) {
                folderMetadata.parents = [rootParentId];
            }

            const folder = await drive.files.create({
                requestBody: folderMetadata,
                fields: 'id',
                supportsAllDrives: true
            });
            baseUploaderFolderId = folder.data.id!;
        }

        // Create or find per-submission folder to prevent filename collisions
        let targetFolderId = baseUploaderFolderId;
        
        if (submissionId) {
            // Use actual folder name if provided (for folder uploads), otherwise use submission ID
            const submissionFolderName = folderName || `Submission_${submissionId}`;
            
            // Escape single quotes in folder name for query
            const escapedFolderName = submissionFolderName.replace(/'/g, "\\'");
            const submissionQ = `name = '${escapedFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${baseUploaderFolderId}' in parents`;
            
            const submissionFolderResponse = await drive.files.list({
                q: submissionQ,
                fields: 'files(id)',
                pageSize: 1,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });

            if (submissionFolderResponse.data.files && submissionFolderResponse.data.files.length > 0) {
                targetFolderId = submissionFolderResponse.data.files[0].id!;
            } else {
                // Create submission folder
                const submissionFolder = await drive.files.create({
                    requestBody: {
                        name: submissionFolderName,
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [baseUploaderFolderId]
                    },
                    fields: 'id',
                    supportsAllDrives: true
                });
                targetFolderId = submissionFolder.data.id!;
            }
        }

        // Handle subfolders if relativePath is provided (e.g., "New folder/extra/file.jpg")
        if (relativePath && relativePath.includes('/')) {
            const pathParts = relativePath.split('/');
            // Remove the filename (last part) to get only folder paths
            const folderPaths = pathParts.slice(0, -1);
            
            // Navigate/create folder structure starting from targetFolderId
            let currentParentId = targetFolderId;
            
            for (const folderName of folderPaths) {
                if (!folderName || folderName.trim() === '') continue;
                
                // Escape single quotes in folder name for query
                const escapedFolderName = folderName.replace(/'/g, "\\'");
                const folderQ = `name = '${escapedFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${currentParentId}' in parents`;
                
                const folderResponse = await drive.files.list({
                    q: folderQ,
                    fields: 'files(id)',
                    pageSize: 1,
                    supportsAllDrives: true,
                    includeItemsFromAllDrives: true
                });
                
                if (folderResponse.data.files && folderResponse.data.files.length > 0) {
                    // Folder exists, use it
                    currentParentId = folderResponse.data.files[0].id!;
                } else {
                    // Create subfolder
                    const subfolder = await drive.files.create({
                        requestBody: {
                            name: folderName,
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [currentParentId]
                        },
                        fields: 'id',
                        supportsAllDrives: true
                    });
                    currentParentId = subfolder.data.id!;
                }
            }
            
            // Set the final parent to the deepest subfolder
            targetFolderId = currentParentId;
        }

        // Set the parent to the target folder (either base, per-submission, or subfolder)
        fileMetadata.parents = [targetFolderId];

        // Upload to Drive
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: file.type,
                body: stream
            },
            fields: 'id, name, webViewLink, webContentLink, size',
            supportsAllDrives: true
        });

        const driveFile = response.data;

        // Set permissions to anyone with link (optional, depends on requirement)
        // Usually for a form upload, the admin wants to see it, but maybe not public.
        // If we want the submitter to see it (e.g. in email), we might need it.
        // For now, we just return the link. The admin can view it because they own it.

        return NextResponse.json({
            url: driveFile.webViewLink, // Link to view in Drive
            downloadUrl: driveFile.webContentLink, // Link to download
            fileId: driveFile.id,
            fileName: originalFileName, // Original filename (same as what was uploaded)
            fileType: file.type,
            fileSize: Number(driveFile.size),
            fieldId: fieldId // Echo back the fieldId for response sheet matching
        });

    } catch (error: any) {
        console.error('Error uploading file to Drive:', error);

        if (error.code === 401 || (error.message && error.message.includes('invalid authentication credentials'))) {
            return NextResponse.json(
                { error: 'Authentication failed', details: 'The form owner needs to sign in again to refresh permissions.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to upload file', details: error.message },
            { status: 500 }
        );
    }
}


