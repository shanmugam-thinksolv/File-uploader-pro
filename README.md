# File Form Uploader

This project is a Next.js application for creating and managing forms with file upload capabilities, integrated with Google Drive.

## 📘 Handover Documentation
**Please refer to [HANDOVER.md](./documentation/HANDOVER.md) for detailed instructions on:**
- Installation & Setup
- Environment Configuration
- Running the Application
- Troubleshooting

**For architecture details, see [PROJECT_GUIDE.md](./documentation/PROJECT_GUIDE.md)**

## Quick Start
1. **Install Dependencies**: `npm install`
2. **Setup Environment**: Copy `documentation/env.example` to `.env` and fill in credentials (including Supabase connection strings).
3. **Setup Database**: `npm run db:setup` (or run `development-scripts/setup-supabase.bat` on Windows)
4. **Run**: `npm run dev`

## Database
This application uses **Supabase (PostgreSQL)** for data storage. See [SUPABASE_MIGRATION.md](./documentation/SUPABASE_MIGRATION.md) for setup instructions.

---
*Original Next.js README content below:*

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
