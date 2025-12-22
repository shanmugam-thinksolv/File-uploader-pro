import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
                createdAt: 'desc'
            }
        })

        // Ensure we always return an array to the frontend
        if (!Array.isArray(submissions)) {
            console.error('Prisma returned non-array submissions:', submissions)
            return NextResponse.json([])
        }

        return NextResponse.json(submissions)
    } catch (error) {
        console.error('Failed to fetch submissions:', error)
        // Return empty array instead of error object to keep frontend logic simple
        return NextResponse.json([])
    }
}
