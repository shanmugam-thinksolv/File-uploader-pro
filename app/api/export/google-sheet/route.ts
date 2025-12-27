import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheetsClient } from '@/lib/google-sheets';

export async function POST(request: Request) {
    const startTime = Date.now();
    
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { formId, submissions } = body;

        if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
            return NextResponse.json(
                { error: 'No submissions provided' },
                { status: 400 }
            );
        }

        console.log(`[Export] Starting export of ${submissions.length} submissions`);

        const sheets = await getSheetsClient(session.user.id);

        // Get form name from submissions
        // If formId is provided, all submissions should be from the same form
        // Otherwise, check if all submissions have the same form title
        let formName = 'All Forms';
        if (submissions.length > 0) {
            const uniqueFormTitles = new Set(
                submissions
                    .map((sub: any) => sub.formTitle)
                    .filter((title: string) => title && title !== 'Unknown')
            );
            
            if (uniqueFormTitles.size === 1) {
                // All submissions are from the same form
                formName = Array.from(uniqueFormTitles)[0] as string;
            } else if (formId) {
                // formId provided but multiple form titles found - use first one
                formName = submissions[0].formTitle || 'Unknown Form';
            } else {
                // Multiple different forms - use "All Forms"
                formName = 'All Forms';
            }
        }
        
        // Format date for title (DD/MM/YYYY format)
        const exportDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Create spreadsheet title: "[Form Name] Exports - [Date]"
        const spreadsheetTitle = `${formName} Exports - ${exportDate}`;

        // Prepare header row
        const headers = [
            'File Name',
            'Uploader Name',
            'Email',
            'Form',
            'Size',
            'Date',
            'File URL'
        ];

        // Prepare data rows with proper date formatting
        const rows = submissions.map((sub: any) => {
            // Fix date: use createdAt if submittedAt is not available
            const dateValue = sub.submittedAt || sub.createdAt || '';
            const formattedDate = formatDate(dateValue);
            
            // Use file URL directly - Google Sheets will auto-convert URLs to clickable links
            const fileUrl = sub.fileUrl || '';
            
            return [
                sub.fileName || '',
                sub.submitterName || '',
                sub.submitterEmail || '',
                sub.formTitle || 'Unknown',
                formatSize(sub.fileSize || 0),
                formattedDate,
                fileUrl // Direct URL - Google Sheets will make it clickable automatically
            ];
        });

        // OPTIMIZATION 1: Create spreadsheet first, then write data with proper formulas
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: spreadsheetTitle
                },
                sheets: [{
                    properties: {
                        sheetId: 0,
                        title: 'Sheet1',
                        gridProperties: {
                            rowCount: Math.max(1000, submissions.length + 10),
                            columnCount: headers.length,
                            frozenRowCount: 1 // Freeze header row immediately
                        }
                    }
                }]
            }
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error('Failed to create spreadsheet');
        }

        console.log(`[Export] Spreadsheet created in ${Date.now() - startTime}ms`);

        // Write header and first batch of data with proper formatting
        const initialRows = rows.slice(0, 500);
        
        // Prepare row data with explicit formatting
        const headerRow = {
            values: headers.map(header => ({
                userEnteredValue: { stringValue: header },
                userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: {
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        bold: true,
                        fontSize: 10
                    },
                    horizontalAlignment: 'CENTER'
                }
            }))
        };

        const dataRows = initialRows.map((row: any[]) => ({
            values: row.map((cell: any, colIndex: number) => {
                // Column G (index 6) is File URL - use USER_ENTERED to auto-convert URLs to links
                if (colIndex === 6 && cell && typeof cell === 'string' && cell.startsWith('http')) {
                    return {
                        userEnteredValue: { stringValue: cell } // USER_ENTERED will be applied via format
                    };
                }
                // All other columns (including File Name) - use RAW to prevent auto-link conversion
                return {
                    userEnteredValue: { stringValue: String(cell || '') }
                };
            })
        }));

        // Write using updateCells to control formatting per column
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    updateCells: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: initialRows.length + 1,
                            startColumnIndex: 0,
                            endColumnIndex: headers.length
                        },
                        rows: [headerRow, ...dataRows],
                        fields: 'userEnteredValue,userEnteredFormat'
                    }
                }]
            }
        });

        // Apply USER_ENTERED formatting only to File URL column (column G, index 6)
        // This will convert URLs to clickable links while keeping File Name as plain text
        if (initialRows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Sheet1!G2:G${initialRows.length + 1}`,
                valueInputOption: 'USER_ENTERED', // Only apply to File URL column
                requestBody: {
                    values: initialRows.map(row => [row[6]]) // Only File URL values
                }
            }).catch(err => {
                console.error('[Export] Error formatting File URL column:', err);
            });
        }

        // OPTIMIZATION 2: If we have more than 500 rows, append the rest using batch append
        // This happens asynchronously after returning the URL to the user
        if (rows.length > 500) {
            const remainingRows = rows.slice(500);
            const CHUNK_SIZE = 2000; // Larger chunks for append operations
            
            // Split remaining data into chunks
            const chunks = [];
            for (let i = 0; i < remainingRows.length; i += CHUNK_SIZE) {
                chunks.push(remainingRows.slice(i, i + CHUNK_SIZE));
            }

            console.log(`[Export] Appending ${remainingRows.length} remaining rows in ${chunks.length} chunks`);

            // Batch append remaining rows - write all columns as RAW first
            const batchUpdateRequests = chunks.map((chunk, index) => {
                const startRow = 501 + (index * CHUNK_SIZE); // Start after initial 500
                return {
                    range: `Sheet1!A${startRow}`,
                    values: chunk
                };
            });

            // Write all data as RAW first (prevents auto-link conversion for File Name)
            sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: 'RAW', // RAW prevents auto-link conversion
                    data: batchUpdateRequests
                }
            }).then(() => {
                // Then update only File URL column (column G) with USER_ENTERED to make URLs clickable
                const urlUpdateRequests = chunks.map((chunk, index) => {
                    const startRow = 501 + (index * CHUNK_SIZE);
                    return {
                        range: `Sheet1!G${startRow}:G${startRow + chunk.length - 1}`,
                        values: chunk.map((row: any[]) => [row[6]]) // Only File URL column
                    };
                });

                return sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        valueInputOption: 'USER_ENTERED', // Only for File URL column
                        data: urlUpdateRequests
                    }
                });
            }).catch(err => {
                console.error('[Export] Error appending remaining rows:', err);
            });
        }

        // OPTIMIZATION 3: Apply final formatting (column auto-resize and link formatting) asynchronously
        // This runs after the sheet is already accessible to the user
        sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: 0,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: headers.length
                            }
                        }
                    },
                ]
            }
        }).catch(err => {
            console.error('[Export] Error applying formatting:', err);
        });


        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

        const totalTime = Date.now() - startTime;
        console.log(`[Export] Complete! Total time: ${totalTime}ms for ${submissions.length} rows`);

        return NextResponse.json({
            success: true,
            sheetId: spreadsheetId,
            sheetUrl,
            rowCount: submissions.length,
            exportTime: totalTime
        });

    } catch (error: any) {
        console.error('Error exporting to Google Sheet:', error);
        
        if (error.code === 403 || error.message?.includes('permission') || error.message?.includes('access')) {
            return NextResponse.json(
                { error: 'PERMISSION_ERROR: Please reconnect your Google account to export to Google Sheets.' },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to export to Google Sheet', details: error.message },
            { status: 500 }
        );
    }
}

function formatSize(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / 1024 / 1024;
    return mb < 0.01 ? '< 0.01 MB' : mb.toFixed(2) + ' MB';
}

function formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }
        // Return in format that Google Sheets can recognize and format
        // Format: "MMM d, yyyy" (e.g., "Dec 27, 2025")
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return '';
    }
}
