import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigration() {
    try {
        console.log('🔧 Running database migration...\n');

        const sql = readFileSync(join(process.cwd(), 'scripts', 'add-missing-columns.sql'), 'utf-8');
        const statements = sql.split(';').filter(s => s.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.trim().substring(0, 80)}...`);
                await prisma.$executeRawUnsafe(statement);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📝 Added columns:');
        console.log('  - buttonTextColor (TEXT)');
        console.log('  - cardStyle (TEXT)');
        console.log('  - borderRadius (TEXT)');
        console.log('  - coverImageUrl (TEXT)');
        console.log('  - driveEnabled (BOOLEAN)');
        console.log('  - uploadFields (JSONB)');
        console.log('  - customQuestions (JSONB)');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();
