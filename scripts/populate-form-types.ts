import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to calculate form type
function calculateFormType(isPublished: boolean, expiryDate: Date | null | string): string {
    const now = new Date();
    const expiry = expiryDate ? new Date(expiryDate) : null;
    
    if (expiry && now > expiry) {
        return 'Expired';
    }
    if (isPublished) {
        return 'Published';
    }
    return 'Draft';
}

async function populateFormTypes() {
    try {
        console.log('Fetching all forms...');
        const forms = await prisma.form.findMany({
            select: {
                id: true,
                isPublished: true,
                expiryDate: true,
                type: true
            }
        });

        console.log(`Found ${forms.length} forms to update`);

        let updated = 0;
        let skipped = 0;

        for (const form of forms) {
            const calculatedType = calculateFormType(form.isPublished, form.expiryDate);
            
            // Only update if type is different or null
            if (form.type !== calculatedType) {
                try {
                    await prisma.form.update({
                        where: { id: form.id },
                        data: { type: calculatedType }
                    });
                    updated++;
                    console.log(`✓ Updated form ${form.id}: ${calculatedType}`);
                } catch (error: any) {
                    console.error(`✗ Failed to update form ${form.id}:`, error.message);
                }
            } else {
                skipped++;
            }
        }

        console.log(`\nCompleted! Updated: ${updated}, Skipped: ${skipped}`);
    } catch (error) {
        console.error('Error populating form types:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

populateFormTypes();

