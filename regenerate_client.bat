@echo off
set "DATABASE_URL=postgresql://neondb_owner:npg_E3jx6dAcXhMm@ep-shiny-boat-a1omgviz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx prisma db push
npx prisma generate
