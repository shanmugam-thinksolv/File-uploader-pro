import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableFormResponses(formId: string) {
    try {
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: {
                id: true,
                title: true,
                isAcceptingResponses: true,
                isPublished: true
            }
        });

        if (!form) {
            console.error(`❌ Form not found: ${formId}`);
            return;
        }

        console.log(`📋 Current form status:`);
        console.log(`   Title: ${form.title}`);
        console.log(`   Is Published: ${form.isPublished}`);
        console.log(`   Is Accepting Responses: ${form.isAcceptingResponses}`);

        if (form.isAcceptingResponses) {
            console.log(`✅ Form is already accepting responses!`);
            return;
        }

        // Update the form to accept responses
        const updatedForm = await prisma.form.update({
            where: { id: formId },
            data: {
                isAcceptingResponses: true,
                isPublished: true // Also ensure it's published
            }
        });

        console.log(`✅ Form updated successfully!`);
        console.log(`   Is Accepting Responses: ${updatedForm.isAcceptingResponses}`);
        console.log(`   Is Published: ${updatedForm.isPublished}`);
        console.log(`\n🌐 Form URL: http://localhost:3000/upload/${formId}`);

    } catch (error) {
        console.error('❌ Error updating form:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get form ID from command line argument
const formId = process.argv[2] || 'c2f7ba5f-1fa3-4f32-aef4-c5d7648ca824';

console.log(`🔧 Enabling responses for form: ${formId}\n`);
enableFormResponses(formId);
