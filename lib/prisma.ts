import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Disable prepared statements in development to avoid HMR connection pooling issues
const databaseUrl = process.env.DATABASE_URL
const urlWithParams = process.env.NODE_ENV === 'development' && databaseUrl
    ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}pgbouncer=true`
    : databaseUrl

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: urlWithParams
        }
    }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to reconnect Prisma client on connection errors
export async function reconnectPrisma() {
    try {
        await prisma.$disconnect()
    } catch (e) {
        // Ignore disconnect errors
    }
    // The next query will automatically reconnect
}
