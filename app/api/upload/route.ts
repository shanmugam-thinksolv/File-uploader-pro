
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

        // Prepare metadata
        const fileMetadata: any = {
            name: file.name,
            mimeType: file.type,
        };

        // If a specific folder is selected, upload to it
        if (form.driveFolderId) {
            fileMetadata.parents = [form.driveFolderId];
        }

        // Upload to Drive
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: file.type,
                body: stream
            },
            fields: 'id, name, webViewLink, webContentLink, size'
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
            fileName: driveFile.name,
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
