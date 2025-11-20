import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting to database...')
        // Try to count forms to verify connection
        const count = await prisma.form.count()
        console.log(`Successfully connected! Found ${count} forms.`)

        // Create a test form
        const form = await prisma.form.create({
            data: {
                title: 'Test Form',
                description: 'Created to verify DB connection',
            }
        })
        console.log('Successfully created a test form:', form.id)

        // Clean up
        await prisma.form.delete({
            where: { id: form.id }
        })
        console.log('Successfully deleted test form.')

    } catch (e) {
        console.error('Error verifying database:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
