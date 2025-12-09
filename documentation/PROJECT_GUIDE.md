# File Form Uploader - Project Guide

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Authentication Flow](#authentication-flow)
3. [Form Creation Workflow](#form-creation-workflow)
4. [File Upload Mechanism](#file-upload-mechanism)
5. [Google Drive Integration](#google-drive-integration)
6. [Database Schema](#database-schema)
7. [Key Features](#key-features)

---

## System Architecture

### Technology Stack
- **Frontend**: Next.js 16 (React 19) with TypeScript
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Storage**: Google Drive API
- **UI**: Tailwind CSS + Radix UI + Framer Motion

### Application Flow
```
User → Landing Page → Login (Google OAuth) → Dashboard → Form Editor
                                                ↓
                                          Save to Supabase
                                                ↓
                                    Publish Form → Share Link
                                                ↓
                            Public Users → Submit Files → Google Drive
```

---

## Authentication Flow

### 1. Initial Authentication
- Users must sign in with their Google account
- NextAuth.js handles the OAuth flow via `/api/auth/[...nextauth]`
- Scopes requested:
  - `openid` - Basic authentication
  - `email` and `profile` - User information
  - `https://www.googleapis.com/auth/drive.file` - Google Drive access

### 2. Token Management
- **Access Token**: Short-lived, used for API calls
- **Refresh Token**: Long-lived, stored in database for token renewal
- Tokens are stored in the `Account` table in Supabase PostgreSQL
- Custom callback in `lib/auth.ts` ensures refresh tokens are preserved

### 3. Protected Routes
- Middleware (`middleware.ts`) protects all `/admin/*` routes
- Redirects unauthenticated users to `/admin/login`
- Public routes: `/`, `/upload/[formId]`, `/preview`

---

## Form Creation Workflow

### Step 1: General Settings
**Location**: `/admin/editor?id=new` - Step 0

- **Form Title**: Main heading for the form
- **Description**: Optional subtitle/instructions
- **Form Type**: Quick or Standard template

### Step 2: Design Customization
**Location**: `/admin/editor` - Step 1

User can customize:
- **Logo**: Upload brand logo (saved to Google Drive)
- **Cover Image**: Background image for form header
- **Colors**:
  - Primary color (buttons, accents)
  - Secondary color (text)
  - Background color
- **Typography**: Font family selection (Inter, Roboto, etc.)
- **Card Style**: Shadow, Flat, or Border
- **Border Radius**: None, Small, Medium, Large, Full

### Step 3: Upload Configuration
**Location**: `/admin/editor` - Step 2

- **File Type Restrictions**: PDF, Images, Videos, Documents, etc.
- **File Size Limit**: Max size per file (MB)
- **Google Drive Folder**: Choose existing or auto-create
- **Multiple Upload Fields**: Up to 3 separate file inputs with individual settings
- **Custom Questions**: Add text, email, dropdown, checkbox fields

### Step 4: Access Control
**Location**: `/admin/editor` - Step 3

- **Access Level**: 
  - `ANYONE` - Public link access
  - `INVITED` - Restricted to specific email addresses
- **Email Collection**: Required, Optional, or Not Included
- **Password Protection**: Optional password gate
- **Expiry Date**: Set form deadline
- **Response Limit**: Max number of submissions

### Step 5: Publish & Share
**Location**: `/admin/editor` - Step 4

- **Generate QR Code**: For mobile scanning
- **Copy Link**: Direct form URL
- **Preview**: Test form before publishing
- **Publishing**: Marks `isPublished = true` in database

---

## File Upload Mechanism

### Frontend Flow (`/upload/[formId]`)
1. **Load Form**: Fetch form configuration from `/api/forms/[formId]`
2. **Validate Access**: Check password, expiry, email restrictions
3. **File Selection**: User selects files via drag-drop or click
4. **Client-Side Validation**:
   - File type matches allowed types
   - File size within limits
5. **Upload**: POST to `/api/submit`

### Backend Processing (`/api/submit/route.ts`)
1. **Receive FormData**: Extract files and metadata
2. **Validate Form**: Check if form exists and is accepting responses
3. **Upload to Google Drive**:
   - Get user's refresh token from database
   - Exchange for access token
   - Use Google Drive API to upload files
   - Place in designated folder (or auto-created folder)
4. **Create Submission Record**: Save to `Submission` table
5. **Return Success**: Send back file URLs and confirmation

---

## Google Drive Integration

### OAuth Setup
**Required Configuration** (Google Cloud Console):
1. Enable APIs:
   - Google Drive API
   - Google People API (for profile)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### Drive Operations

#### 1. Folder Management (`/api/drive/folders`)
- Lists all folders in user's Drive
- Used by folder selector in editor

#### 2. Folder Creation
- Automatic: When first file is uploaded and no folder is selected
- Manual: User selects existing folder via Google Picker

#### 3. File Upload (`lib/google-drive.ts`)
```typescript
uploadFileToDrive(accessToken, file, folderId) {
  → Create file metadata
  → Set parent folder
  → Upload file content
  → Return Drive file ID and URL
}
```

#### 4. Token Refresh
- Stored refresh tokens in `Account` table
- Automatic renewal when access token expires
- Handled by `lib/google-drive.ts`

---

## Database Schema

### Core Tables

#### `User`
```prisma
id            String    @id @default(uuid())
email         String?   @unique
name          String?
image         String?
emailVerified DateTime?
```
- Stores authenticated users
- Linked to Google account

#### `Account`
```prisma
id                String  @id @default(uuid())
userId            String
provider          String  // "google"
access_token      String? // Short-lived
refresh_token     String? // Long-lived
expires_at        Int?
```
- Stores OAuth tokens
- Critical for Drive API access

#### `Form`
```prisma
id                    String   @id @default(uuid())
title                 String   @default("Untitled Form")
description           String?
userId                String
isPublished           Boolean  @default(false)
// Design fields
logoUrl               String?
primaryColor          String   @default("#000000")
backgroundColor       String   @default("#f3f4f6")
// Upload settings
allowedTypes          String   @default("")
maxSizeMB             Int      @default(5)
driveFolderId         String?
// Access control
accessLevel           String   @default("ANYONE")
allowedEmails         String   @default("")
password              String?
expiryDate            DateTime?
// Advanced
uploadFields          Json?    // Custom upload fields
customQuestions       Json?    // Custom form questions
```
- Main form configuration
- Stores all customization options

#### `Submission`
```prisma
id             String   @id @default(uuid())
formId         String
fileUrl        String
fileName       String
fileType       String
fileSize       Int
submitterEmail String?
submitterName  String?
answers        Json?    // Answers to custom questions
files          Json?    // Multiple files data
createdAt      DateTime @default(now())
```
- Stores each form submission
- Links to Drive file URLs

---

## Key Features

### 1. Live Preview
- Real-time preview in editor's Design tab
- Shows exact form appearance
- Updates instantly on changes

### 2. Drag & Drop
- Logo upload
- Cover image upload
- File submissions on public form

### 3. Responsive Design
- Mobile-friendly forms
- QR code generation for easy mobile access
- Adaptive layouts

### 4. Security
- Password protection option
- Email whitelist for restricted access
- Session-based authentication
- CSRF protection via NextAuth

### 5. Auto-Save
- Forms auto-save every 1 second after changes
- Visual indicator shows save status
- Prevents data loss

### 6. Customization
- Full design control (colors, fonts, layout)
- Multiple upload fields per form
- Custom questions (text, email, dropdown, etc.)
- Submission limits and expiry

---

## API Routes Reference

### Public Routes
- `GET /api/forms/[formId]` - Fetch form configuration
- `POST /api/submit` - Submit files to form
- `GET /api/images/[fileId]` - Proxy Drive images for preview

### Protected Routes (Require Auth)
- `POST /api/forms` - Create new form
- `PUT /api/forms/[formId]` - Update form
- `GET /api/drive/folders` - List Drive folders
- `POST /api/drive/upload-asset` - Upload logo/cover to Drive
- `GET /api/drive/token` - Get current access token
- `GET /api/submissions` - View form submissions

---

## Development Scripts

Located in `development-scripts/`:

- **`check-env.js`**: Verifies environment variables are set
- **`check-tokens.ts`**: Inspects OAuth tokens in database
- **`check-db.js`**: Validates database connection
- **`fix-prisma.bat`**: Regenerates Prisma client (Windows)
- **`enable-form-responses.ts`**: Bulk enable form responses

---

*This guide provides a comprehensive overview of how the File Form Uploader works. For setup instructions, see HANDOVER.md.*
