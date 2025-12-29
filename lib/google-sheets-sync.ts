import { getSheetsClient } from './google-sheets';
import { prisma } from './prisma';

/**
 * Get or create a response sheet for live syncing
 * Creates the sheet on first submission
 */
export async function getOrCreateLiveSyncSheet(
    userId: string,
    formId: string,
    formTitle: string
): Promise<string> {
    try {
        // Check if sheet already exists
        const form = await prisma.form.findUnique({
            where: { id: formId },
            select: { responseSheetId: true }
        });

        if (form?.responseSheetId) {
            // Verify the sheet still exists
            try {
                const sheets = await getSheetsClient(userId);
                await sheets.spreadsheets.get({
                    spreadsheetId: form.responseSheetId
                });
                return form.responseSheetId;
            } catch (error: any) {
                // Sheet was deleted, create a new one
                console.log(`[Live Sync] Sheet ${form.responseSheetId} was deleted, creating new one`);
            }
        }

        // Create new sheet
        const sheets = await getSheetsClient(userId);
        
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: `${formTitle} - Uploads`
                }
            }
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error('Failed to create spreadsheet');
        }
        
        // Get the first sheet ID and name
        const firstSheet = spreadsheet.data.sheets?.[0];
        const sheetId = firstSheet?.properties?.sheetId ?? 0;
        const sheetName = firstSheet?.properties?.title || 'Sheet1';

        // Set up headers - flat row structure
        const headers = [
            'Submission ID',
            'Uploaded At',
            'Upload Type',
            'Folder Name',
            'Relative Path',
            'File Name',
            'File Size',
            'File URL',
            'Field Name',
            'Uploader Email'
        ];

        console.log(`[Live Sync] Setting up headers in sheet: ${sheetName}`);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers]
            }
        });

        // Format header row and freeze it
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: {
                                        red: 0.2,
                                        green: 0.6,
                                        blue: 0.4
                                    },
                                    textFormat: {
                                        foregroundColor: {
                                            red: 1,
                                            green: 1,
                                            blue: 1
                                        },
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId: sheetId,
                                gridProperties: {
                                    frozenRowCount: 1
                                }
                            },
                            fields: 'gridProperties.frozenRowCount'
                        }
                    }
                ]
            }
        });

        // Save sheet ID to database
        await prisma.form.update({
            where: { id: formId },
            data: { responseSheetId: spreadsheetId }
        });

        console.log(`[Live Sync] Created new sheet: ${spreadsheetId}`);
        return spreadsheetId;
    } catch (error: any) {
        console.error('[Live Sync] Error creating/getting sheet:', error);
        throw error;
    }
}

/**
 * Sync files to response sheet
 * Creates one row per file (flat structure)
 */
export async function syncFilesToResponseSheet(
    userId: string,
    formId: string,
    formTitle: string,
    submissionId: string,
    submissionData: {
        timestamp: string;
        submitterEmail: string | null;
        files: Array<{
            url: string;
            name: string;
            size: number;
            fieldId?: string;
            fieldLabel?: string;
            uploadType?: 'file' | 'folder';
            folderName?: string;
            relativePath?: string;
        }>;
    }
): Promise<string> {
    try {
        console.log(`[Live Sync] Starting sync for submission ${submissionId}`);
        
        // Get or create the sheet
        const spreadsheetId = await getOrCreateLiveSyncSheet(userId, formId, formTitle);
        
        const sheets = await getSheetsClient(userId);
        
        // Format date & time
        const date = new Date(submissionData.timestamp);
        const formattedDateTime = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        
        // Format file size
        const formatSize = (bytes: number) => {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        };
        
        // Get the sheet name from the spreadsheet
        const spreadsheetInfo = await sheets.spreadsheets.get({
            spreadsheetId
        });
        const sheetName = spreadsheetInfo.data.sheets?.[0]?.properties?.title || 'Sheet1';
        
        console.log(`[Live Sync] Using sheet name: ${sheetName}`);
        
        // Get current row count to know where to insert
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:A`
        });
        const currentRowCount = sheetData.data.values ? sheetData.data.values.length : 1;
        const newRowIndex = currentRowCount; // Row index (0-based, but we're appending after header)
        
        console.log(`[Live Sync] Current row count: ${currentRowCount}, will insert at index: ${newRowIndex}`);
        
        // Validate files array
        if (!submissionData.files || submissionData.files.length === 0) {
            throw new Error('No files provided for response sheet sync');
        }

        console.log(`[Live Sync] Preparing ${submissionData.files.length} file(s) for sync`);

        // Create ONE ROW PER FILE (flat structure)
        const rows = submissionData.files.map((file, index) => {
            const uploadType = file.uploadType === 'folder' ? 'folder' : 'file';
            const folderName = file.folderName || '';
            const relativePath = file.relativePath || file.name; // Default to file name if no path
            
            const row = [
                submissionId,                                  // Submission ID
                formattedDateTime,                            // Uploaded At
                uploadType,                                   // Upload Type (file | folder)
                folderName,                                   // Folder Name
                relativePath,                                 // Relative Path
                file.name || 'Unknown',                       // File Name
                formatSize(file.size || 0),                   // File Size
                file.url || '',                               // File URL (will be clickable)
                file.fieldLabel || 'Unknown',                 // Field Name
                submissionData.submitterEmail || 'Anonymous'  // Uploader Email
            ];
            
            console.log(`[Live Sync] Row ${index + 1}:`, row);
            return row;
        });
        
        console.log(`[Live Sync] Appending ${rows.length} row(s) to sheet ${spreadsheetId}`);
        
        // Append all rows at once
        // Use USER_ENTERED so Google Sheets auto-detects URLs and makes them clickable
        const appendResponse = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:J`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: rows
            }
        });
        
        console.log(`[Live Sync] Append response:`, {
            updatedCells: appendResponse.data.updates?.updatedCells,
            updatedRange: appendResponse.data.updates?.updatedRange,
            updatedRows: appendResponse.data.updates?.updatedRows
        });
        
        // Get the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });
        const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId ?? 0;
        
        // Format data rows: white background (not green)
        // Note: Google Sheets automatically detects URLs in plain text and makes them clickable
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: newRowIndex,
                                endRowIndex: newRowIndex + rows.length
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: {
                                        red: 1,
                                        green: 1,
                                        blue: 1
                                    }
                                }
                            },
                            fields: 'userEnteredFormat.backgroundColor'
                        }
                    }
                ]
            }
        });
        
        console.log(`[Live Sync] Synced 1 submission with ${submissionData.files.length} file(s) to sheet ${spreadsheetId}`);
        
        return spreadsheetId;
    } catch (error: any) {
        console.error('[Live Sync] Error syncing files:', error);
        
        // Check if it's a permission error
        if (error.code === 403 || error.message?.includes('permission') || error.message?.includes('access')) {
            throw new Error('PERMISSION_ERROR: Please reconnect your Google account to continue using response sheets.');
        }
        
        throw error;
    }
}

