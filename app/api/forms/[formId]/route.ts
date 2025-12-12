import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        const form = await prisma.form.findUnique({
            where: { id: formId },
        });

        if (!form) {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
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
                        expiryDate: form.expiryDate,
                        message: 'This form is no longer accepting submissions.'
                    },
                    { status: 410 } // 410 Gone - resource is no longer available
                );
            }
        }

        return NextResponse.json(form);
    } catch (error) {
        console.error('Error fetching form:', error);
        return NextResponse.json(
            { error: 'Failed to fetch form' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        const body = await request.json();

        // Whitelist allowed fields to prevent "Unknown argument" errors
        const ALLOWED_FIELDS = [
            'title', 'description', 'logoUrl', 'primaryColor', 'secondaryColor',
            'backgroundColor', 'fontFamily', 'buttonTextColor', 'cardStyle',
            'borderRadius', 'coverImageUrl', 'allowedTypes', 'maxSizeMB',
            'driveEnabled', 'driveFolderId', 'driveFolderName', 'driveFolderUrl',
            'isPasswordProtected', 'password', 'isCaptchaEnabled', 'enableSubmitAnother',
            'isPublished', 'isAcceptingResponses', 'expiryDate', 'accessLevel',
            'allowedEmails', 'emailFieldControl', 'enableMetadataSpreadsheet',
            'subfolderOrganization', 'customSubfolderField', 'enableSmartGrouping',
            'uploadFields', 'customQuestions'
        ];

        // Filter body to only include allowed fields
        const updateData: any = {};
        for (const key of Object.keys(body)) {
            if (ALLOWED_FIELDS.includes(key) && body[key] !== undefined) {
                updateData[key] = body[key];
            }
        }

        // Map accessProtectionType to isPasswordProtected
        // Frontend uses accessProtectionType ("PUBLIC", "PASSWORD", "GOOGLE")
        // Database uses isPasswordProtected (boolean)
        if (body.accessProtectionType !== undefined) {
            if (body.accessProtectionType === 'PASSWORD') {
                updateData.isPasswordProtected = true;
                // Handle empty password strings
                if (updateData.password === '' || updateData.password === null || updateData.password === undefined) {
                    updateData.password = null;
                }
            } else {
                // PUBLIC or GOOGLE - no password protection
                updateData.isPasswordProtected = false;
                updateData.password = null;
            }
        } else if (updateData.password && updateData.password.trim() !== '') {
            // If password is provided but accessProtectionType wasn't, assume password protection
            updateData.isPasswordProtected = true;
        }

        console.log('Filtered Update Data Keys:', Object.keys(updateData));

        const form = await prisma.form.update({
            where: { id: formId },
            data: updateData,
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('Error updating form:', error);
        // @ts-ignore
        if (error.meta) {
            // @ts-ignore
            console.error('Prisma error meta:', error.meta);
        }
        return NextResponse.json(
            { error: 'Failed to update form', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        await prisma.form.delete({
            where: { id: formId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting form:', error);
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Form not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete form' },
            { status: 500 }
        );
    }
}