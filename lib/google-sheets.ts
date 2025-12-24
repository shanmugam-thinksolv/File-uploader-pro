import { google } from 'googleapis'
import { prisma } from './prisma'
import { getDriveClient } from './google-drive'

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
    try {
        console.log(`[Spreadsheet] Getting or creating spreadsheet for form: ${formTitle} (${formId})`)
        
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
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
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
                fields: 'id',
                supportsAllDrives: true
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
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
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
            fields: 'id, parents',
            supportsAllDrives: true
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
    } catch (error: any) {
        console.error('[Spreadsheet] Error in getOrCreateMetadataSpreadsheet:', error)
        console.error('[Spreadsheet] Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            userId,
            formId,
            formTitle
        })
        throw error // Re-throw so caller knows it failed
    }
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
        console.log(`[Spreadsheet] Starting spreadsheet append for form: ${formTitle} (${formId})`)
        
        const spreadsheetId = await getOrCreateMetadataSpreadsheet(
            userId,
            formId,
            formTitle,
            driveFolderId
        )
        
        console.log(`[Spreadsheet] Got spreadsheet ID: ${spreadsheetId}`)
        
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
        
        console.log(`[Spreadsheet] Appending row data:`, rowData)
        
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
        
        console.log(`[Spreadsheet] Successfully appended submission to spreadsheet: ${spreadsheetId}`)
    } catch (error: any) {
        console.error('[Spreadsheet] Error appending to spreadsheet:', error)
        console.error('[Spreadsheet] Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: error.stack
        })
        // Don't throw - we don't want spreadsheet errors to break submissions
        // Just log the error
    }
}

/**
 * Get or create a response sheet for a form
 * Returns the spreadsheet ID
 */
export async function getOrCreateResponseSheet(
    userId: string,
    formId: string,
    formTitle: string,
    driveFolderId: string | null,
    uploadFields: Array<{ id: string; label: string }>,
    customQuestions: Array<{ id: string; label: string; type: string }>
): Promise<string> {
    try {
        console.log(`[Response Sheet] Getting or creating response sheet for form: ${formTitle} (${formId})`)
        
        const drive = await getDriveClient(userId)
        const sheets = await getSheetsClient(userId)
        
        const spreadsheetName = `${formTitle} - Responses`
    
        // Determine the target folder (same logic as file uploads)
        let targetFolderId = driveFolderId
        
        // If a root folder is specified, check for "File Uploader Pro" subfolder
        if (driveFolderId) {
            const q = `name = 'File Uploader Pro' and mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${driveFolderId}' in parents`
            const folderResponse = await drive.files.list({
                q: q,
                fields: 'files(id)',
                pageSize: 1,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
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
                    fields: 'id',
                    supportsAllDrives: true
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
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
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
                        title: 'Responses'
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
                fields: 'id, parents',
                supportsAllDrives: true
            })
        }
        
        // Build header row: Submission ID, Date & Time, then upload fields, then questions
        const headers = [
            'Submission ID',
            'Submitted Date & Time'
        ]
        
        // Filter out fields/questions with empty labels
        const validUploadFields = uploadFields.filter(field => field.label && field.label.trim() !== '')
        const validQuestions = customQuestions.filter(q => q.label && q.label.trim() !== '')
        
        // Add columns for each upload field (only fields with labels)
        validUploadFields.forEach(field => {
            headers.push(field.label)
        })
        
        // Add columns for each custom question (only questions with labels)
        validQuestions.forEach(question => {
            headers.push(question.label)
        })
        
        // Set up the header row
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Responses!A1:Z1',
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers]
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
    } catch (error: any) {
        console.error('[Response Sheet] Error in getOrCreateResponseSheet:', error)
        console.error('[Response Sheet] Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            userId,
            formId,
            formTitle
        })
        throw error // Re-throw so caller knows it failed
    }
}

/**
 * Append submission data to the response sheet
 * Returns the spreadsheet ID so it can be stored in the database
 */
export async function appendSubmissionToResponseSheet(
    userId: string,
    formId: string,
    formTitle: string,
    driveFolderId: string | null,
    uploadFields: Array<{ id: string; label: string }>,
    customQuestions: Array<{ id: string; label: string; type: string }>,
    submissionId: string,
    submissionData: {
        timestamp: string
        submitterName: string | null
        submitterEmail: string | null
        files: Array<{ url: string; name: string; type: string; size: number; fieldId?: string; label?: string }>
        answers: Array<{ questionId: string; answer: any }>
    }
): Promise<string> {
    try {
        console.log(`[Response Sheet] Starting response sheet append for form: ${formTitle} (${formId})`)
        
        const spreadsheetId = await getOrCreateResponseSheet(
            userId,
            formId,
            formTitle,
            driveFolderId,
            uploadFields,
            customQuestions
        )
        
        console.log(`[Response Sheet] Got spreadsheet ID: ${spreadsheetId}`)
        
        const sheets = await getSheetsClient(userId)
        
        // Build row data: Submission ID, Date & Time, then upload fields, then questions
        // Format timestamp as: DD/MM/YYYY HH:MM:SS
        const date = new Date(submissionData.timestamp)
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
        
        const rowData: any[] = [
            submissionId,
            formattedDate
        ]
        
        // Filter out fields/questions with empty labels (same as header generation)
        const validUploadFields = uploadFields.filter(field => field.label && field.label.trim() !== '')
        const validQuestions = customQuestions.filter(q => q.label && q.label.trim() !== '')
        
        // Add data for each upload field (only fields with labels)
        validUploadFields.forEach(field => {
            const fieldFiles = submissionData.files.filter(f => f.fieldId === field.id)
            console.log(`[Response Sheet] Field "${field.label}" (ID: ${field.id}):`, {
                totalFiles: submissionData.files.length,
                matchedFiles: fieldFiles.length,
                fileDetails: submissionData.files.map(f => ({ name: f.name, fieldId: f.fieldId }))
            })
            const fileLinks = fieldFiles.map(f => f.url).filter(Boolean)
            rowData.push(fileLinks.join('\n') || '')
        })
        
        // Add data for each custom question (only questions with labels)
        validQuestions.forEach(question => {
            const answer = submissionData.answers.find(a => a.questionId === question.id)
            console.log(`[Response Sheet] Question "${question.label}" (ID: ${question.id}):`, {
                answerFound: !!answer,
                answerValue: answer?.answer
            })
            let answerValue = ''
            
            if (answer) {
                if (Array.isArray(answer.answer)) {
                    // For checkboxes, join multiple selections
                    answerValue = answer.answer.join(', ')
                } else {
                    answerValue = String(answer.answer || '')
                }
            }
            
            rowData.push(answerValue)
        })
        
        console.log(`[Response Sheet] Appending row data:`, rowData)
        
        // Append the row
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Responses!A:Z',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [rowData]
            }
        })
        
        console.log(`[Response Sheet] Successfully appended submission to response sheet: ${spreadsheetId}`)
        
        // Return the spreadsheet ID so it can be stored in the database
        return spreadsheetId
    } catch (error: any) {
        console.error('[Response Sheet] Error appending to response sheet:', error)
        console.error('[Response Sheet] Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            stack: error.stack
        })
        
        // Check if it's a permission error
        if (error.code === 403 || error.message?.includes('permission') || error.message?.includes('access')) {
            throw new Error('PERMISSION_ERROR: Please reconnect your Google account to continue using response sheets.')
        }
        
        // Re-throw other errors so caller can handle them
        throw error
    }
}

