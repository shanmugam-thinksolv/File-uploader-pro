
import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-drive';
import { prisma } from '@/lib/prisma';
import { Readable } from 'stream';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const formId = formData.get('formId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!formId) {
            return NextResponse.json({ error: 'Form ID is required' }, { status: 400 });
        }

        // Find the form to get the owner
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: { userId: true, driveEnabled: true, driveFolderId: true }
        } as any) as any;

        if (!form || !form.userId) {
            return NextResponse.json({ error: 'Form not found or has no owner' }, { status: 404 });
        }

        // Convert File to Stream
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = Readable.from(buffer);

        // Get Drive Client for the form owner
        const drive = await getDriveClient(form.userId);

        // Generate unique filename to avoid conflicts when multiple files with same name are uploaded
        const originalFileName = file.name || 'unnamed_file';
        const lastDotIndex = originalFileName.lastIndexOf('.');
        const hasExtension = lastDotIndex > 0 && lastDotIndex < originalFileName.length - 1;
        
        let fileExtension = '';
        let fileNameWithoutExt = originalFileName;
        
        if (hasExtension) {
            fileExtension = originalFileName.substring(lastDotIndex);
            fileNameWithoutExt = originalFileName.substring(0, lastDotIndex);
        }
        
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);
        const uniqueFileName = `${fileNameWithoutExt}_${timestamp}_${randomId}${fileExtension}`;

        // Prepare metadata
        const fileMetadata: any = {
            name: uniqueFileName,
            mimeType: file.type,
        };

        // Determine the root parent (either specific folder or root)
        const rootParentId = form.driveFolderId || null;

        // Ensure "File Uploader Pro" folder exists inside the root parent
        let targetFolderId = rootParentId;

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
            targetFolderId = folderResponse.data.files[0].id!;
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
            targetFolderId = folder.data.id!;
        }

        // Set the parent to the target folder
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
            fileName: originalFileName, // Return original filename for display
            uniqueFileName: driveFile.name, // Return unique filename for reference
            fileType: file.type,
            fileSize: Number(driveFile.size)
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
