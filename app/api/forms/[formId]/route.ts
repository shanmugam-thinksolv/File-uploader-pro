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

        const form = await prisma.form.update({
            where: { id: formId },
            data: body,
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error('Error updating form:', error);
        return NextResponse.json(
            { error: 'Failed to update form' },
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
    } catch (error) {
        console.error('Error deleting form:', error);
        return NextResponse.json(
            { error: 'Failed to delete form' },
            { status: 500 }
        );
    }
}
