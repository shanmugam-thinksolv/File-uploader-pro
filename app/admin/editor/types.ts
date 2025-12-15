export interface EditorFormData {
    id: string;
    title: string;
    description: string;

    // Upload Config
    allowedTypes: string;
    driveEnabled: boolean;
    driveFolderId: string;
    driveFolderUrl: string;
    driveFolderName: string;
    driveType?: 'MY_DRIVE' | 'SHARED_DRIVE';
    sharedDriveId?: string;

    // Access Control
    isAcceptingResponses: boolean;
    expiryDate: string | null;
    isPublished: boolean;
    accessLevel: "ANYONE" | "INVITED";
    allowedEmails: string;
    emailFieldControl: "REQUIRED" | "OPTIONAL" | "NOT_INCLUDED";
    accessProtectionType: "PUBLIC" | "PASSWORD" | "GOOGLE";
    password?: string;
    // New optional keys for backend compatibility
    accessProtection?: 'public' | 'password' | 'google_oauth';
    inviteCodeHash?: string;
    allowedDomains?: string[];
    driveIntegrationEnabled?: boolean;

    // Organization
    enableMetadataSpreadsheet: boolean;
    subfolderOrganization: "NONE" | "DATE" | "SUBMITTER" | "CUSTOM";
    customSubfolderField: string;
    enableSmartGrouping: boolean;

    // Design
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    buttonTextColor: string;
    cardStyle: "shadow" | "flat" | "border";
    borderRadius: "none" | "sm" | "md" | "lg" | "full";
    coverImageUrl: string;

    // Dynamic Fields
    uploadFields: UploadField[];
    customQuestions: CustomQuestion[];
}

export interface UploadField {
    id: string;
    label: string;
    allowedTypes: string;
    required: boolean;
}

export interface CustomQuestion {
    id: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
    wordLimit?: number;
    allowOther?: boolean;
}
