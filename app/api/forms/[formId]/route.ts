import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

        // Remove readonly/computed fields that shouldn't be updated
        const { id, createdAt, updatedAt, submissions, ...updateData } = body;

        // Ensure JSON fields have proper defaults
        if ('uploadFields' in updateData && !updateData.uploadFields) {
            updateData.uploadFields = [];
        }
        if ('customQuestions' in updateData && !updateData.customQuestions) {
            updateData.customQuestions = [];
        }

        const form = await prisma.form.update({
            where: { id: formId },
            data: updateData as any,
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('Error updating form:', error);
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
