# File Uploader Pro - Project Presentation Content

## 1. MODULE DESCRIPTION

### Overview
**File Uploader Pro** is a web-based application that allows users to create customizable file upload forms and automatically store uploaded files in Google Drive. The system eliminates the need for uploaders to create accounts while providing administrators with full control over form design, access, and file organization.

### System Modules

#### **Module 1: Authentication & User Management**
**Purpose**: Handles user authentication and session management

**Components**:
- Google OAuth 2.0 integration
- User registration and login
- Session management
- Token storage and refresh

**Key Features**:
- Secure Google Sign-In
- Automatic token refresh for Google Drive API
- Protected admin routes
- User profile management

**Technologies**: NextAuth.js, Google OAuth API

---

#### **Module 2: Form Creation & Editor**
**Purpose**: Allows administrators to create and customize file upload forms

**Components**:
- Form builder interface
- Design customization tools
- Upload field configuration
- Custom question builder

**Key Features**:
- Multi-step form creation wizard
- Real-time preview
- Logo and cover image upload
- Color scheme customization
- Typography selection
- Multiple upload fields (up to 3)
- Custom questions (text, email, dropdown, checkbox)
- Auto-save functionality

**Technologies**: React, TypeScript, Tailwind CSS

---

#### **Module 3: Access Control & Security**
**Purpose**: Manages form access permissions and security settings

**Components**:
- Access level configuration
- Password protection
- Email whitelist management
- Expiry date settings

**Key Features**:
- Public access (anyone with link)
- Password-protected forms
- Google Sign-In requirement
- Email domain restrictions
- Form expiry dates
- Response limits

**Technologies**: Next.js API Routes, Database validation

---

#### **Module 4: File Upload & Processing**
**Purpose**: Handles file uploads from public users and processes them

**Components**:
- File upload interface
- Client-side validation
- Server-side processing
- Google Drive integration

**Key Features**:
- Drag-and-drop file upload
- Multiple file support
- File type validation
- File size limits
- Progress tracking
- Error handling

**Technologies**: Next.js API Routes, Google Drive API

---

#### **Module 5: Google Drive Integration**
**Purpose**: Manages file storage and organization in Google Drive

**Components**:
- Drive folder management
- File upload to Drive
- Folder creation
- Token management

**Key Features**:
- Automatic folder creation
- Manual folder selection
- File organization (by date, submitter, custom)
- Shared Drive support
- Metadata spreadsheet creation
- Response sheet synchronization

**Technologies**: Google Drive API, OAuth 2.0

---

#### **Module 6: Submission Management**
**Purpose**: Tracks and manages form submissions

**Components**:
- Submission dashboard
- File listing
- Metadata tracking
- Export functionality

**Key Features**:
- View all submissions
- Filter by date/form
- Download files
- Export to Google Sheets
- Submission analytics

**Technologies**: React, Database queries

---

#### **Module 7: Dashboard & Analytics**
**Purpose**: Provides overview of forms and submissions

**Components**:
- Form listing
- Statistics display
- Quick actions
- Form management

**Key Features**:
- List all forms
- View form status
- Quick edit/delete
- Submission counts
- Form analytics

**Technologies**: React, Database aggregation

---

## 2. DFD / ERD / SFD (System Flow Diagram)

### 2.1 System Flow Diagram (SFD)

```
┌─────────────┐
│   User      │
│  (Admin)    │
└──────┬──────┘
       │
       │ 1. Login with Google
       ▼
┌─────────────────────┐
│  Authentication     │
│  Module             │
│  (NextAuth.js)      │
└──────┬──────────────┘
       │
       │ 2. Create Session
       ▼
┌─────────────────────┐
│  Dashboard          │
│  (Admin Panel)      │
└──────┬──────────────┘
       │
       │ 3. Create New Form
       ▼
┌─────────────────────┐
│  Form Editor        │
│  (Multi-step)       │
└──────┬──────────────┘
       │
       │ 4. Configure Form
       │    - Design
       │    - Upload Fields
       │    - Access Control
       │    - Drive Folder
       ▼
┌─────────────────────┐
│  Database           │
│  (Supabase)         │
└──────┬──────────────┘
       │
       │ 5. Save Form
       │    (isPublished = true)
       ▼
┌─────────────────────┐
│  Generate Form Link │
│  & QR Code          │
└──────┬──────────────┘
       │
       │ 6. Share Link
       ▼
┌─────────────────────┐
│  Public User        │
│  (Uploader)         │
└──────┬──────────────┘
       │
       │ 7. Access Form
       │    (No login required)
       ▼
┌─────────────────────┐
│  Upload Form        │
│  (Public Page)      │
└──────┬──────────────┘
       │
       │ 8. Upload Files
       │    + Answer Questions
       ▼
┌─────────────────────┐
│  API: /api/submit   │
│  (Backend)          │
└──────┬──────────────┘
       │
       │ 9. Validate & Process
       │    - Check access
       │    - Validate files
       │    - Get Drive token
       ▼
┌─────────────────────┐
│  Google Drive API   │
│  (File Storage)     │
└──────┬──────────────┘
       │
       │ 10. Upload Files
       │     to Drive Folder
       ▼
┌─────────────────────┐
│  Database           │
│  (Save Submission)   │
└──────┬──────────────┘
       │
       │ 11. Return Success
       ▼
┌─────────────────────┐
│  Public User        │
│  (Confirmation)     │
└─────────────────────┘
```

---

### 2.2 Data Flow Diagram (DFD) - Level 0 (Context Diagram)

```
                    ┌──────────────┐
                    │   Google     │
                    │   Drive API  │
                    └──────┬───────┘
                           │
                           │ Files
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  ▼                  │
┌───────┴───────┐   ┌──────────────┐   ┌──────┴──────┐
│   Admin      │   │   File       │   │   Public     │
│   User       │──▶│   Uploader   │──▶│   User       │
│              │   │   Pro System │   │              │
└───────┬───────┘   └──────────────┘   └──────┬──────┘
        │                  │                  │
        │                  │                  │
        │                  ▼                  │
        │          ┌──────────────┐          │
        └─────────▶│   Database   │◀─────────┘
                   │  (Supabase)  │
                   └──────────────┘
```

---

### 2.3 Data Flow Diagram (DFD) - Level 1 (Process Decomposition)

```
┌─────────────────────────────────────────────────────────────┐
│                    FILE UPLOADER PRO SYSTEM                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  1.0        │         │  2.0        │         │  3.0        │
│ Authenticate│────────▶│ Create Form │────────▶│ Configure   │
│ User        │         │             │         │ Form        │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                      │                        │
       │ User Data            │ Form Data              │ Config Data
       ▼                      ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Database   │         │   Database   │         │   Database   │
│  (User)      │         │   (Form)     │         │  (Form)      │
└──────────────┘         └──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  4.0        │         │  5.0        │         │  6.0        │
│ Publish     │────────▶│ Receive     │────────▶│ Process     │
│ Form        │         │ Submission  │         │ Files       │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                      │                        │
       │ Form Link            │ File Data              │ Drive Token
       ▼                      │                        ▼
┌──────────────┐              │              ┌──────────────┐
│   Public     │              │              │   Google    │
│   User       │              │              │   Drive     │
└──────────────┘              │              └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │   Database   │
                    │ (Submission) │
                    └──────────────┘
```

---

### 2.4 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│    User      │
├──────────────┤
│ id (PK)      │◄────┐
│ name         │     │
│ email (UK)   │     │
│ image        │     │
│ emailVerified│     │
└──────────────┘     │
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       │             │             │
┌──────┴──────┐ ┌───┴──────┐ ┌────┴──────┐
│   Account   │ │ Session  │ │   Form    │
├─────────────┤ ├──────────┤ ├───────────┤
│ id (PK)     │ │ id (PK)  │ │ id (PK)   │
│ userId (FK) │ │ userId   │ │ userId    │
│ provider    │ │ (FK)     │ │ (FK)      │
│ access_token│ │ token    │ │ title     │
│ refresh_    │ │ expires  │ │ desc      │
│   token     │ └──────────┘ │ logoUrl   │
│ expires_at  │              │ primary   │
└─────────────┘              │   Color   │
                             │ allowed   │
                             │   Types   │
                             │ drive     │
                             │ FolderId  │
                             │ password  │
                             │ access    │
                             │ Level     │
                             │ expiry    │
                             │ Date      │
                             │ upload    │
                             │ Fields    │
                             │ custom    │
                             │ Questions │
                             │ isPub     │
                             │ lished    │
                             └─────┬─────┘
                                   │
                                   │
                          ┌────────┴────────┐
                          │                 │
                          │                 │
                    ┌─────▼──────┐          │
                    │ Submission │          │
                    ├────────────┤          │
                    │ id (PK)    │          │
                    │ formId (FK)│          │
                    │ fileUrl    │          │
                    │ fileName   │          │
                    │ fileType   │          │
                    │ fileSize   │          │
                    │ submitter  │          │
                    │   Email    │          │
                    │ submitter  │          │
                    │   Name     │          │
                    │ answers    │          │
                    │ files      │          │
                    │ metadata   │          │
                    │ createdAt  │          │
                    └────────────┘          │
                                           │
                    ┌──────────────────────┘
                    │
                    │
            ┌───────▼────────┐
            │ Verification    │
            │ Token           │
            ├─────────────────┤
            │ identifier      │
            │ token (UK)      │
            │ expires         │
            └─────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
UK = Unique Key
```

**Relationships**:
- **User** → **Account** (One-to-Many): One user can have multiple OAuth accounts
- **User** → **Session** (One-to-Many): One user can have multiple active sessions
- **User** → **Form** (One-to-Many): One user can create multiple forms
- **Form** → **Submission** (One-to-Many): One form can have multiple submissions

---

## 3. DATABASE DESIGN

### 3.1 Database Overview

**Database System**: PostgreSQL (Supabase)
**ORM**: Prisma
**Purpose**: Store user data, form configurations, and submission records

---

### 3.2 Table Descriptions

#### **Table 1: User**
**Purpose**: Stores authenticated user information

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | String (UUID) | Primary Key | Unique user identifier |
| name | String | Nullable | User's display name |
| email | String | Unique, Nullable | User's email address |
| emailVerified | DateTime | Nullable | Email verification timestamp |
| image | String | Nullable | Profile picture URL |

**Relationships**:
- Has many Accounts (OAuth providers)
- Has many Sessions
- Has many Forms

---

#### **Table 2: Account**
**Purpose**: Stores OAuth provider account information and tokens

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | String (UUID) | Primary Key | Unique account identifier |
| userId | String | Foreign Key → User.id | Reference to user |
| type | String | Not Null | OAuth account type |
| provider | String | Not Null | Provider name (e.g., "google") |
| providerAccountId | String | Not Null | Provider's user ID |
| email | String | Nullable | Email from provider |
| refresh_token | String | Nullable | Long-lived refresh token |
| access_token | String | Nullable | Short-lived access token |
| expires_at | Integer | Nullable | Token expiration timestamp |
| token_type | String | Nullable | Token type (e.g., "Bearer") |
| scope | String | Nullable | OAuth scopes granted |

**Relationships**:
- Belongs to User (Many-to-One)

**Indexes**:
- Unique constraint on (provider, providerAccountId)

---

#### **Table 3: Session**
**Purpose**: Manages user sessions for authentication

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | String (UUID) | Primary Key | Unique session identifier |
| sessionToken | String | Unique, Not Null | Session token string |
| userId | String | Foreign Key → User.id | Reference to user |
| expires | DateTime | Not Null | Session expiration time |

**Relationships**:
- Belongs to User (Many-to-One)

---

#### **Table 4: Form**
**Purpose**: Stores form configuration and settings

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | String (UUID) | Primary Key | Unique form identifier |
| userId | String | Foreign Key → User.id | Form owner |
| title | String | Default: "Untitled Form" | Form title |
| description | String | Nullable | Form description |

**Design Fields**:
| logoUrl | String | Nullable | Logo image URL |
| primaryColor | String | Default: "#000000" | Primary theme color |
| secondaryColor | String | Default: "#ffffff" | Secondary theme color |
| backgroundColor | String | Default: "#f3f4f6" | Background color |
| fontFamily | String | Default: "Inter" | Font family name |
| buttonTextColor | String | Default: "#ffffff" | Button text color |
| cardStyle | String | Default: "shadow" | Card style (shadow/flat/border) |
| borderRadius | String | Default: "md" | Border radius size |
| coverImageUrl | String | Nullable | Cover image URL |

**Upload Configuration**:
| allowedTypes | String | Default: "" | Comma-separated file types |
| maxSizeMB | Integer | Default: 0 | Max file size in MB (0=unlimited) |
| driveEnabled | Boolean | Default: false | Google Drive integration enabled |
| driveFolderId | String | Nullable | Google Drive folder ID |
| driveFolderName | String | Nullable | Google Drive folder name |
| driveFolderUrl | String | Nullable | Google Drive folder URL |
| driveType | String | Nullable | Drive type (MY_DRIVE/SHARED_DRIVE) |
| sharedDriveId | String | Nullable | Shared Drive ID |

**Access Control**:
| isPasswordProtected | Boolean | Default: false | Password protection enabled |
| password | String | Nullable | Form password (hashed) |
| isPublished | Boolean | Default: false | Form published status |
| isAcceptingResponses | Boolean | Default: true | Currently accepting submissions |
| expiryDate | DateTime | Nullable | Form expiration date |
| accessLevel | String | Default: "ANYONE" | Access level (ANYONE/INVITED) |
| allowedEmails | String | Default: "" | Comma-separated allowed emails |
| allowedDomains | String | Default: "" | Comma-separated allowed domains |
| emailFieldControl | String | Default: "OPTIONAL" | Email field requirement |

**Organization**:
| enableMetadataSpreadsheet | Boolean | Default: false | Create metadata spreadsheet |
| enableResponseSheet | Boolean | Default: false | Create response sheet |
| responseSheetId | String | Nullable | Google Sheet ID |
| subfolderOrganization | String | Default: "NONE" | Organization method |
| customSubfolderField | String | Nullable | Custom field for organization |
| enableSmartGrouping | Boolean | Default: false | Smart grouping enabled |

**Dynamic Fields**:
| uploadFields | JSON | Nullable | Array of upload field configs |
| customQuestions | JSON | Nullable | Array of custom question configs |

**Timestamps**:
| createdAt | DateTime | Auto-generated | Creation timestamp |
| updatedAt | DateTime | Auto-updated | Last update timestamp |

**Relationships**:
- Belongs to User (Many-to-One)
- Has many Submissions (One-to-Many)

---

#### **Table 5: Submission**
**Purpose**: Stores file submission records

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | String (UUID) | Primary Key | Unique submission identifier |
| formId | String | Foreign Key → Form.id | Reference to form |
| fileUrl | String | Not Null | Google Drive file URL |
| fileName | String | Not Null | Original file name |
| fileType | String | Not Null | File MIME type |
| fileSize | Integer | Not Null | File size in bytes |
| submitterName | String | Nullable | Submitter's name |
| submitterEmail | String | Nullable | Submitter's email |
| answers | JSON | Nullable | Answers to custom questions |
| files | JSON | Nullable | Array of file objects (multiple files) |
| metadata | JSON | Nullable | Additional metadata |
| createdAt | DateTime | Auto-generated | Submission timestamp |

**Relationships**:
- Belongs to Form (Many-to-One)

---

#### **Table 6: VerificationToken**
**Purpose**: Stores email verification tokens

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| identifier | String | Not Null | Email or identifier |
| token | String | Unique, Not Null | Verification token |
| expires | DateTime | Not Null | Token expiration time |

**Indexes**:
- Unique constraint on (identifier, token)

---

### 3.3 Database Relationships Summary

```
User (1) ──────< (Many) Account
User (1) ──────< (Many) Session
User (1) ──────< (Many) Form
Form (1) ──────< (Many) Submission
```

---

### 3.4 Key Design Decisions

1. **JSON Fields**: Used for flexible storage of:
   - `uploadFields`: Dynamic upload field configurations
   - `customQuestions`: Custom question configurations
   - `answers`: Variable question responses
   - `files`: Multiple file metadata

2. **Token Storage**: OAuth tokens stored in Account table for:
   - Automatic token refresh
   - Persistent Drive API access
   - Secure token management

3. **Cascade Deletes**: 
   - Deleting a User deletes all related Forms
   - Deleting a Form deletes all related Submissions
   - Ensures data integrity

4. **Nullable Fields**: Many fields are nullable to support:
   - Optional form features
   - Gradual form building
   - Flexible configurations

---

### 3.5 Indexes and Performance

**Primary Indexes**:
- All tables have UUID primary keys
- User.email has unique constraint
- Account has unique constraint on (provider, providerAccountId)
- Session.sessionToken has unique constraint

**Query Optimization**:
- Foreign key indexes on userId, formId
- Timestamp indexes for sorting submissions
- JSON fields indexed for common queries

---

## Summary

This document provides comprehensive information about:
1. **Module Description**: 7 core modules covering all system functionality
2. **DFD/ERD/SFD**: Visual representations of system flow and data relationships
3. **Database Design**: Complete schema with 6 tables, relationships, and design rationale

Use this content to create your presentation slides with appropriate diagrams and explanations.

