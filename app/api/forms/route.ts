import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

        // Set defaults for required fields
        createData.title = createData.title || 'Untitled Form';
        createData.description = createData.description || '';
        createData.maxSizeMB = createData.maxSizeMB || 0; // No size limit - set to 0 to indicate unlimited
        createData.userId = session.user.id;

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

        const form = await prisma.form.create({
            data: createData,
        });

        return NextResponse.json(form, { status: 201 });
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
        const forms = await prisma.form.findMany({
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
