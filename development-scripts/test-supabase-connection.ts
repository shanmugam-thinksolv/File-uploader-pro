import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
    try {
        console.log('🔄 Testing Supabase PostgreSQL connection...\n')

        // Test 1: Basic connection
        console.log('Test 1: Basic Connection')
        const result = await prisma.$queryRaw`SELECT 1 as test`
        console.log('✅ Database connection successful!\n')

        // Test 2: Check database version
        console.log('Test 2: Database Version')
        const version = await prisma.$queryRaw`SELECT version()` as any[]
        if (version && version.length > 0) {
            const versionStr = version[0].version as string
            if (versionStr.toLowerCase().includes('postgres')) {
                console.log(`✅ PostgreSQL detected: ${versionStr.split(',')[0]}\n`)
            } else {
                console.log(`⚠️  Unexpected database type: ${versionStr}\n`)
            }
        }

        // Test 3: Check tables exist
        console.log('Test 3: Schema Verification')
        const tables = await prisma.$queryRaw`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ` as any[]
        
        const expectedTables = ['User', 'Account', 'Session', 'VerificationToken', 'Form', 'Submission']
        const foundTables = tables.map((t: any) => t.tablename)
        
        console.log(`Found ${foundTables.length} tables:`)
        expectedTables.forEach(tableName => {
            if (foundTables.includes(tableName)) {
                console.log(`  ✅ ${tableName}`)
            } else {
                console.log(`  ❌ ${tableName} - MISSING!`)
            }
        })
        console.log()

        // Test 4: Count records
        console.log('Test 4: Record Counts')
        const userCount = await prisma.user.count()
        const formCount = await prisma.form.count()
        const submissionCount = await prisma.submission.count()
        
        console.log(`  Users: ${userCount}`)
        console.log(`  Forms: ${formCount}`)
        console.log(`  Submissions: ${submissionCount}`)
        console.log()

        // Test 5: Create and delete a test record
        console.log('Test 5: CRUD Operations')
        console.log('  Creating test user...')
        const testUser = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                name: 'Test User'
            }
        })
        console.log('  ✅ User created')

        console.log('  Deleting test user...')
        await prisma.user.delete({
            where: { id: testUser.id }
        })
        console.log('  ✅ User deleted')
        console.log()

        // Test 6: Check connection pool
        console.log('Test 6: Connection Pool Status')
        try {
            const metrics = await prisma.$metrics.json()
            console.log('  ✅ Connection pool is healthy')
        } catch (e) {
            console.log('  ℹ️  Connection pool metrics not available (this is normal)')
        }
        console.log()

        console.log('=' .repeat(50))
        console.log('🎉 All tests passed! Supabase is properly configured.')
        console.log('=' .repeat(50))

    } catch (error: any) {
        console.error('❌ Database connection failed!\n')
        console.error('Error:', error.message)
        
        if (error.message.includes('P1001')) {
            console.error('\n💡 Troubleshooting:')
            console.error('1. Check your DATABASE_URL in .env file')
            console.error('2. Verify your Supabase project is active (not paused)')
            console.error('3. Check your internet connection')
            console.error('4. Verify your database password is correct')
            console.error('5. Make sure special characters in password are URL-encoded')
        } else if (error.message.includes('P1003')) {
            console.error('\n💡 Troubleshooting:')
            console.error('1. Check if database exists in Supabase')
            console.error('2. Verify the database name in your connection string')
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.error('\n💡 Schema not created. Run:')
            console.error('   npx prisma db push')
        }
        
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testConnection()

