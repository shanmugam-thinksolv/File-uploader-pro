import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        // Filter body to only include allowed fields (skip undefined values)
        const createData: any = {};
        for (const key of Object.keys(body)) {
            if (ALLOWED_FIELDS.includes(key) && body[key] !== undefined) {
                createData[key] = body[key];
            }
        }

        // Map accessProtectionType to isPasswordProtected
        // Frontend uses accessProtectionType ("PUBLIC", "PASSWORD", "GOOGLE")
        // Database uses isPasswordProtected (boolean)
        if (body.accessProtectionType !== undefined) {
            if (body.accessProtectionType === 'PASSWORD') {
                createData.isPasswordProtected = true;
                // Handle empty password strings
                if (createData.password === '' || createData.password === null || createData.password === undefined) {
                    createData.password = null;
                }
            } else {
                // PUBLIC or GOOGLE - no password protection
                createData.isPasswordProtected = false;
                createData.password = null;
            }
        } else if (createData.password && createData.password.trim() !== '') {
            // If password is provided but accessProtectionType wasn't, assume password protection
            createData.isPasswordProtected = true;
        } else {
            // Default to no password protection if not specified
            createData.isPasswordProtected = createData.isPasswordProtected || false;
            if (!createData.isPasswordProtected) {
                createData.password = null;
            }
        }

        // Handle allowedDomains - convert array to comma-separated string
        if (createData.allowedDomains !== undefined) {
            if (Array.isArray(createData.allowedDomains)) {
                createData.allowedDomains = createData.allowedDomains.join(',');
            } else if (typeof createData.allowedDomains !== 'string') {
                createData.allowedDomains = "";
            }
        }

        // Set defaults for required fields
        createData.title = createData.title || 'Untitled Form';
        createData.description = createData.description || '';
        createData.maxSizeMB = createData.maxSizeMB || 0; // No size limit - set to 0 to indicate unlimited
        createData.userId = session.user.id;
        
        // Calculate form type (will be set after creation if field exists)
        const expiryDate = createData.expiryDate ? new Date(createData.expiryDate) : null;
        const calculatedType = calculateFormType(createData.isPublished || false, expiryDate);

        // Store allowedDomains for raw update
        const allowedDomainsValue = createData.allowedDomains;
        delete createData.allowedDomains;

        // Handle expiryDate - convert empty strings to null, validate datetime format
        if (createData.expiryDate !== undefined) {
            if (createData.expiryDate === null || createData.expiryDate === '' || createData.expiryDate === 'null') {
                createData.expiryDate = null;
            } else {
                // If it's a partial datetime (from datetime-local input), convert to full ISO-8601
                const dateValue = new Date(createData.expiryDate);
                if (isNaN(dateValue.getTime())) {
                    // Invalid date, set to null
                    createData.expiryDate = null;
                } else {
                    // Convert to ISO-8601 string
                    createData.expiryDate = dateValue.toISOString();
                }
            }
        }

        // Ensure JSON fields are properly stringified
        if (createData.uploadFields) {
            createData.uploadFields = typeof createData.uploadFields === 'string' 
                ? createData.uploadFields 
                : JSON.stringify(createData.uploadFields);
        } else {
            createData.uploadFields = JSON.stringify([]);
        }

        if (createData.customQuestions) {
            createData.customQuestions = typeof createData.customQuestions === 'string' 
                ? createData.customQuestions 
                : JSON.stringify(createData.customQuestions);
        } else {
            createData.customQuestions = JSON.stringify([]);
        }

        console.log('Filtered Create Data Keys:', Object.keys(createData));

        // Create form
        const form = await prisma.form.create({
            data: createData as any,
        });

        // Try to update type if field exists (gracefully handle if Prisma client not regenerated)
        try {
            // Use raw SQL to update the type and allowedDomains fields to bypass Prisma Client's 
            // "Unknown argument" errors if the client hasn't been regenerated yet.
            await prisma.$executeRawUnsafe(
                `UPDATE "Form" SET "type" = $1, "allowedDomains" = $2 WHERE "id" = $3`,
                calculatedType,
                allowedDomainsValue || "",
                form.id
            );
        } catch (typeError: any) {
            // If fields don't exist yet, that's okay
            console.log('Additional fields not available yet via raw SQL:', typeError.message);
        }

        return NextResponse.json({ ...form, type: calculatedType }, { status: 201 });
    } catch (error) {
        console.error('Error creating form:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'Failed to create form', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // First, batch update expired forms in a single query (more efficient)
        try {
            await prisma.form.updateMany({
                where: {
                    userId: session.user.id,
                    expiryDate: { not: null, lte: now },
                    isAcceptingResponses: true
                },
                data: {
                    isAcceptingResponses: false
                }
            });
        } catch (updateError) {
            console.error('Error updating expired forms:', updateError);
            // Continue even if update fails - don't break the response
        }

        // Then fetch all forms (already updated)
        // Handle connection pooling issues gracefully
        let forms;
        try {
            forms = await prisma.form.findMany({
                where: {
                    userId: session.user.id
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { submissions: true }
                    }
                }
            } as any);
            
            // Calculate and update type for each form (update all, including NULL values)
            const updatePromises = forms.map(async (form: any) => {
                const formType = calculateFormType(form.isPublished, form.expiryDate);
                // Update if type is null or different
                if (!form.type || form.type !== formType) {
                    try {
                        // Use raw SQL to update the type field to bypass Prisma Client's 
                        // "Unknown argument type" error if the client hasn't been regenerated yet.
                        await prisma.$executeRawUnsafe(
                            `UPDATE "Form" SET "type" = $1 WHERE "id" = $2`,
                            formType,
                            form.id
                        );
                    } catch (e: any) {
                        // Fallback: If raw SQL fails (e.g., column doesn't exist at all yet),
                        // we just skip it and let the UI use the calculated value.
                        console.log(`Note: Background type update skipped for form ${form.id}`);
                    }
                }
                return { ...form, type: formType };
            });
            forms = await Promise.all(updatePromises);
        } catch (queryError: any) {
            // Handle PostgreSQL prepared statement errors (common with connection pooling)
            if (queryError.message?.includes('prepared statement') || 
                queryError.code === '26000' || 
                queryError.message?.includes('26000') ||
                queryError.message?.includes('ConnectorError')) {
                console.error('Database connection error (prepared statement):', queryError.message);
                // Return empty array - the next request should work fine
                // This is a transient connection pooling issue
                return NextResponse.json([]);
            }
            // For other errors, log and return empty array
            console.error('Error fetching forms:', queryError);
            return NextResponse.json([]);
        }

        // Ensure forms is an array
        if (!Array.isArray(forms)) {
            console.error('Prisma returned non-array:', forms);
            return NextResponse.json([]);
        }

        return NextResponse.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        // Return empty array instead of error to prevent frontend crash
        return NextResponse.json([]);
    }
}
