import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFormData(formId: string) {
    try {
        const form = await prisma.form.findUnique({
            where: { id: formId }
        });

        if (!form) {
            console.error(`❌ Form not found: ${formId}`);
            return;
        }

        console.log(`\n📋 Form Data for: ${formId}\n`);
        console.log(`Title: ${form.title}`);
        console.log(`Description: ${form.description || '(empty)'}`);
        console.log(`\n🎨 Design:`);
        console.log(`  Logo URL: ${form.logoUrl || '(none)'}`);
        console.log(`  Primary Color: ${form.primaryColor}`);
        console.log(`  Background Color: ${form.backgroundColor}`);
        console.log(`  Font Family: ${form.fontFamily}`);
        console.log(`  Button Text Color: ${form.buttonTextColor}`);
        console.log(`  Card Style: ${form.cardStyle}`);
        console.log(`  Border Radius: ${form.borderRadius}`);

        console.log(`\n📤 Upload Config:`);
        console.log(`  Allowed Types: ${form.allowedTypes}`);
        console.log(`  Max Size MB: ${form.maxSizeMB}`);

        console.log(`\n📝 Custom Questions:`);
        const questions = typeof form.customQuestions === 'string'
            ? JSON.parse(form.customQuestions)
            : form.customQuestions;
        if (questions && Array.isArray(questions) && questions.length > 0) {
            questions.forEach((q: any, i: number) => {
                console.log(`  ${i + 1}. ${q.label} (${q.type}) - Required: ${q.required}`);
            });
        } else {
            console.log(`  (none)`);
        }

        console.log(`\n📁 Upload Fields:`);
        const uploadFields = typeof form.uploadFields === 'string'
            ? JSON.parse(form.uploadFields)
            : form.uploadFields;
        if (uploadFields && Array.isArray(uploadFields) && uploadFields.length > 0) {
            uploadFields.forEach((f: any, i: number) => {
                console.log(`  ${i + 1}. ${f.label} - Types: ${f.allowedTypes}`);
            });
        } else {
            console.log(`  (none)`);
        }

        console.log(`\n✅ Status:`);
        console.log(`  Published: ${form.isPublished}`);
        console.log(`  Accepting Responses: ${form.isAcceptingResponses}`);
        console.log(`  Drive Enabled: ${form.driveEnabled}`);

        console.log(`\n📊 Metadata:`);
        console.log(`  Created: ${form.createdAt}`);
        console.log(`  Updated: ${form.updatedAt}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

const formId = process.argv[2] || 'c2f7ba5f-1fa3-4f32-aef4-c5d7648ca824';
checkFormData(formId);
