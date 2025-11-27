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
        const {
            title,
            description,
            allowedTypes,
            maxSizeMB,
            driveEnabled,
            isAcceptingResponses,
            expiryDate,
            enableMetadataSpreadsheet,
            subfolderOrganization,
            customSubfolderField,
            enableSmartGrouping,
            logoUrl,
            primaryColor,
            backgroundColor,
            fontFamily,
            accessLevel,
            allowedEmails,
            emailFieldControl,
            buttonTextColor,
            cardStyle,
            borderRadius,
            coverImageUrl,
            driveFolderId,
            driveFolderName,
            driveFolderUrl,
            uploadFields,
            customQuestions
        } = body;

        const form = await prisma.form.create({
            data: {
                title: title || 'Untitled Form',
                description: description || '',
                allowedTypes,
                maxSizeMB,
                driveEnabled,
                driveFolderId,
                driveFolderName,
                driveFolderUrl,
                isAcceptingResponses,
                expiryDate,
                enableMetadataSpreadsheet,
                subfolderOrganization,
                customSubfolderField,
                enableSmartGrouping,
                logoUrl,
                primaryColor,
                backgroundColor,
                fontFamily,
                accessLevel,
                allowedEmails,
                emailFieldControl,
                buttonTextColor,
                cardStyle,
                borderRadius,
                coverImageUrl,
                uploadFields: uploadFields ? JSON.stringify(uploadFields) : JSON.stringify([]),
                customQuestions: customQuestions ? JSON.stringify(customQuestions) : JSON.stringify([]),
                userId: session.user.id
            },
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

        const forms = await prisma.form.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: { createdAt: 'desc' },
        } as any);
        return NextResponse.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch forms' },
            { status: 500 }
        );
    }
}
