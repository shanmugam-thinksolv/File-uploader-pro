import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const formId = searchParams.get('formId')

        const where = formId ? { formId } : {}

        const submissions = await prisma.submission.findMany({
            where,
            include: {
                form: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: {
                submittedAt: 'desc'
            }
        })

        return NextResponse.json(submissions)
    } catch (error) {
        console.error('Failed to fetch submissions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch submissions' },
            { status: 500 }
        )
    }
}
