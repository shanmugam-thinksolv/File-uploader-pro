import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description } = body;

        const form = await prisma.form.create({
            data: {
                title: title || 'Untitled Form',
                description: description || '',
            },
        });

        return NextResponse.json(form, { status: 201 });
    } catch (error) {
        console.error('Error creating form:', error);
        return NextResponse.json(
            { error: 'Failed to create form' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const forms = await prisma.form.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(forms);
    } catch (error) {
        console.error('Error fetching forms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch forms' },
            { status: 500 }
        );
    }
}
