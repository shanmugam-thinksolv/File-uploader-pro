import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheetsClient } from '@/lib/google-sheets';

export async function POST(request: Request) {
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

        const sheets = await getSheetsClient(session.user.id);

        // Create a new spreadsheet
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: `Form Uploads Export - ${new Date().toLocaleDateString()}`
                }
            }
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error('Failed to create spreadsheet');
        }

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

        // Prepare data rows
        const rows = submissions.map((sub: any) => [
            sub.fileName || '',
            sub.submitterName || '',
            sub.submitterEmail || '',
            sub.formTitle || 'Unknown',
            formatSize(sub.fileSize || 0),
            formatDate(sub.submittedAt || ''),
            sub.fileUrl || ''
        ]);

        // Write headers and data
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers, ...rows]
            }
        });

        // Format header row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        updateCells: {
                            range: {
                                sheetId: 0,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            rows: [
                                {
                                    values: headers.map(() => ({
                                        userEnteredFormat: {
                                            backgroundColor: {
                                                red: 0.2,
                                                green: 0.4,
                                                blue: 0.8
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
                                    }))
                                }
                            ],
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId: 0,
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

        const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

        return NextResponse.json({
            success: true,
            sheetId: spreadsheetId,
            sheetUrl
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
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}


