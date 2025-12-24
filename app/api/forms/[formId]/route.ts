import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to calculate form type
function calculateFormType(isPublished: boolean, expiryDate: Date | null | string): string {
    const now = new Date();
    const expiry = expiryDate ? new Date(expiryDate) : null;
    
    if (expiry && now > expiry) {
        return 'Expired';
    }
    if (isPublished) {
        return 'Published';
    }
    return 'Draft';
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ formId: string }> }
) {
    try {
        const { formId } = await params;
        const form = await prisma.form.findUnique({
            where: { id: formId },
            include: {
                _count: {
                    select: { submissions: true }
                }
            }
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

        // Calculate and update type if needed
        const formType = calculateFormType(form.isPublished, form.expiryDate);
        
        // Derive accessProtectionType for the frontend
        let accessProtectionType = 'PUBLIC';
        if (form.isPasswordProtected) {
            accessProtectionType = 'PASSWORD';
        } else if (form.accessLevel === 'INVITED') {
            accessProtectionType = 'GOOGLE';
        }

        if (form.type !== formType) {
            try {
                // Use raw SQL to update the type field to bypass Prisma Client's 
                // "Unknown argument type" error if the client hasn't been regenerated yet.
                await prisma.$executeRawUnsafe(
                    `UPDATE "Form" SET "type" = $1 WHERE "id" = $2`,
                    formType,
                    formId
                );
            } catch (e: any) {
                // Fallback: If raw SQL fails (e.g., column doesn't exist at all yet),
                // we just skip it and let the UI use the calculated value.
                console.log(`Note: Background type update skipped for form ${formId}`);
            }
        }

        return NextResponse.json({ ...form, type: formType, accessProtectionType });
    } catch (error: any) {
        console.error('Error fetching form:', error);
        console.error('Error details:', {
            message: error?.message,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack
        });
        return NextResponse.json(
            { 
                error: 'Failed to fetch form',
                details: error?.message || 'Unknown error',
                code: error?.code
            },
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
            'enableResponseSheet', 'responseSheetId',
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

        // Handle allowedDomains - convert array to comma-separated string
        const allowedDomainsValue = updateData.allowedDomains;
        delete updateData.allowedDomains;

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

        // Handle expiryDate - if updating expiryDate, check if form should be enabled
        if (updateData.expiryDate !== undefined) {
            if (updateData.expiryDate === null || updateData.expiryDate === '' || updateData.expiryDate === 'null') {
                updateData.expiryDate = null;
            } else {
                // Convert to proper date format
                const dateValue = new Date(updateData.expiryDate);
                if (isNaN(dateValue.getTime())) {
                    updateData.expiryDate = null;
                } else {
                    updateData.expiryDate = dateValue.toISOString();
                }
            }
        }

        // Check if form is expired and prevent enabling if expired
        const currentForm = await prisma.form.findUnique({
            where: { id: formId },
            select: { expiryDate: true }
        });

        const finalExpiryDate = updateData.expiryDate !== undefined
            ? (updateData.expiryDate ? new Date(updateData.expiryDate) : null)
            : (currentForm?.expiryDate ? new Date(currentForm.expiryDate) : null);

        // If trying to enable a form that is expired, prevent it
        if (finalExpiryDate && updateData.isAcceptingResponses === true) {
            const now = new Date();
            if (now > finalExpiryDate) {
                return NextResponse.json(
                    {
                        error: 'Cannot enable expired form',
                        message: 'Please update the expiry date to a future date to enable this form.'
                    },
                    { status: 400 }
                );
            }
        }

        // If form is expired and not explicitly enabling, ensure it's disabled
        if (finalExpiryDate && updateData.isAcceptingResponses !== false) {
            const now = new Date();
            if (now > finalExpiryDate) {
                updateData.isAcceptingResponses = false;
            }
        }

        // Calculate form type (will be set after update if field exists)
        const currentIsPublished = updateData.isPublished !== undefined 
            ? updateData.isPublished 
            : (await prisma.form.findUnique({ where: { id: formId }, select: { isPublished: true } }))?.isPublished || false;
        const calculatedType = calculateFormType(currentIsPublished, finalExpiryDate);

        console.log('Filtered Update Data Keys:', Object.keys(updateData));

        // Update form
        const form = await prisma.form.update({
            where: { id: formId },
            data: updateData as any,
        });

        // Try to update type if field exists (gracefully handle if Prisma client not regenerated)
        try {
            // Use raw SQL to update the type and allowedDomains fields to bypass Prisma Client's 
            // "Unknown argument" errors if the client hasn't been regenerated yet.
            const domainsString = Array.isArray(allowedDomainsValue) 
                ? allowedDomainsValue.join(',') 
                : (typeof allowedDomainsValue === 'string' ? allowedDomainsValue : "");

            await prisma.$executeRawUnsafe(
                `UPDATE "Form" SET "type" = $1, "allowedDomains" = $2 WHERE "id" = $3`,
                calculatedType,
                domainsString,
                formId
            );
        } catch (typeError: any) {
            // If fields don't exist yet, that's okay
            console.log('Additional fields not available yet via raw SQL:', typeError.message);
        }

        return NextResponse.json({ ...form, type: calculatedType });
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