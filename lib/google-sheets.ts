import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import { getDriveClient } from './google-drive'

const prisma = new PrismaClient()

/**
 * Get Google Sheets API client for a user
 */
export async function getSheetsClient(userId: string) {
    // Get the user's account with access token (same as Drive client)
    const account = await prisma.account.findFirst({
        where: {
            userId: userId,
            provider: 'google'
        },
        select: {
            access_token: true,
            refresh_token: true,
            expires_at: true
        }
    })

    if (!account || !account.access_token) {
        throw new Error('User not authenticated with Google')
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expiry_date: account.expires_at ? account.expires_at * 1000 : undefined
    })

    // Handle token refresh events to update the database
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await prisma.account.updateMany({
                where: { userId: userId, provider: 'google' },
                data: {
                    access_token: tokens.access_token,
                    expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
                    refresh_token: tokens.refresh_token || undefined
                }
            });
        }
    });

    return google.sheets({ version: 'v4', auth: oauth2Client })
}

/**
 * Create or find a metadata spreadsheet for a form
 * Returns the spreadsheet ID
 */
export async function getOrCreateMetadataSpreadsheet(
    userId: string,
    formId: string,
    formTitle: string,
    driveFolderId: string | null
): Promise<string> {
    const drive = await getDriveClient(userId)
    const sheets = await getSheetsClient(userId)
    
    const spreadsheetName = `${formTitle} - Upload Metadata`
    
    // Determine the target folder (same logic as file uploads)
    let targetFolderId = driveFolderId
    
    // If a root folder is specified, check for "File Uploader Pro" subfolder
    if (driveFolderId) {
        const q = `name = 'File Uploader Pro' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${driveFolderId}' in parents`
        const folderResponse = await drive.files.list({
            q: q,
            fields: 'files(id)',
            pageSize: 1
        })
        
        if (folderResponse.data.files && folderResponse.data.files.length > 0) {
            targetFolderId = folderResponse.data.files[0].id!
        } else {
            // Create "File Uploader Pro" folder if it doesn't exist
            const folderMetadata: any = {
                name: 'File Uploader Pro',
                mimeType: 'application/vnd.google-apps.folder',
                parents: [driveFolderId]
            }
            
            const folder = await drive.files.create({
                requestBody: folderMetadata,
                fields: 'id'
            })
            targetFolderId = folder.data.id!
        }
    }
    
    // First, try to find existing spreadsheet
    let searchQuery = `name = '${spreadsheetName}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    
    if (targetFolderId) {
        searchQuery += ` and '${targetFolderId}' in parents`
    }
    
    const searchResponse = await drive.files.list({
        q: searchQuery,
        fields: 'files(id, name)',
        pageSize: 1
    })
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        // Spreadsheet exists, return its ID
        return searchResponse.data.files[0].id!
    }
    
    // Spreadsheet doesn't exist, create it
    const createResponse = await sheets.spreadsheets.create({
        requestBody: {
            properties: {
                title: spreadsheetName
            },
            sheets: [{
                properties: {
                    title: 'Submissions'
                }
            }]
        }
    })
    
    const spreadsheetId = createResponse.data.spreadsheetId!
    
    // Move spreadsheet to the correct folder if targetFolderId is set
    if (targetFolderId) {
        await drive.files.update({
            fileId: spreadsheetId,
            addParents: targetFolderId,
            removeParents: 'root',
            fields: 'id, parents'
        })
    }
    
    // Set up the header row
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Submissions!A1:Z1',
        valueInputOption: 'RAW',
        requestBody: {
            values: [[
                'Timestamp',
                'Submitter Name',
                'Submitter Email',
                'File Name',
                'File Type',
                'File Size (bytes)',
                'File URL',
                'All Files',
                'Answers',
                'Metadata'
            ]]
        }
    })
    
    // Format header row (bold, freeze first row)
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    repeatCell: {
                        range: {
                            sheetId: 0,
                            startRowIndex: 0,
                            endRowIndex: 1
                        },
                        cell: {
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
                        },
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
    })
    
    return spreadsheetId
}

/**
 * Append submission data to the metadata spreadsheet
 */
export async function appendSubmissionToSpreadsheet(
    userId: string,
    formId: string,
    formTitle: string,
    driveFolderId: string | null,
    submissionData: {
        timestamp: string
        submitterName: string | null
        submitterEmail: string | null
        files: Array<{ name: string; type: string; size: number; url: string }>
        answers: Array<{ questionId: string; answer: any }>
        metadata: Record<string, any>
    }
): Promise<void> {
    try {
        const spreadsheetId = await getOrCreateMetadataSpreadsheet(
            userId,
            formId,
            formTitle,
            driveFolderId
        )
        
        const sheets = await getSheetsClient(userId)
        
        // Format the data for the spreadsheet
        const primaryFile = submissionData.files[0] || {}
        const allFilesInfo = submissionData.files.map(f => `${f.name} (${f.type})`).join('; ')
        const answersText = submissionData.answers
            .map(a => `${a.questionId}: ${a.answer}`)
            .join('; ')
        const metadataText = JSON.stringify(submissionData.metadata)
        
        // Prepare the row data
        const rowData = [
            submissionData.timestamp,
            submissionData.submitterName || '',
            submissionData.submitterEmail || '',
            primaryFile.name || '',
            primaryFile.type || '',
            primaryFile.size?.toString() || '0',
            primaryFile.url || '',
            allFilesInfo,
            answersText,
            metadataText
        ]
        
        // Append the row
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Submissions!A:Z',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [rowData]
            }
        })
        
        console.log(`Successfully appended submission to spreadsheet: ${spreadsheetId}`)
    } catch (error) {
        console.error('Error appending to spreadsheet:', error)
        // Don't throw - we don't want spreadsheet errors to break submissions
        // Just log the error
    }
}

