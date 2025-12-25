import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillAccountEmails() {
    console.log('Fetching all accounts...');
    
    const accounts = await prisma.account.findMany({
        include: {
            user: {
                select: {
                    email: true
                }
            }
        }
    });

    console.log(`Found ${accounts.length} accounts to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const account of accounts) {
        // Only update if email is missing and user has an email
        if (!account.email && account.user?.email) {
            console.log(`Updating account ${account.id}: Setting email to ${account.user.email}`);
            await prisma.account.update({
                where: { id: account.id },
                data: { email: account.user.email }
            });
            updatedCount++;
        } else if (account.email) {
            console.log(`Skipping account ${account.id}: Email already set to ${account.email}`);
            skippedCount++;
        } else {
            console.log(`Skipping account ${account.id}: User has no email`);
            skippedCount++;
        }
    }

    console.log(`\nCompleted! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
}

backfillAccountEmails()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

