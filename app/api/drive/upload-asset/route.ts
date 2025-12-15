import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDriveClient } from '@/lib/google-drive'
import { Readable } from 'stream'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const parentFolderId = formData.get('parentFolderId') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const drive = await getDriveClient(session.user.id)

        let finalParentId = parentFolderId

        if (!finalParentId) {
            const formTitle = (formData.get('formTitle') as string) || 'Untitled Form'

            // Search for folder with formTitle in root (implied by no parents query, or we can just search globally)
            // We'll search for a folder with this name that is not trashed.
            const searchRes = await drive.files.list({
                q: `name = '${formTitle.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id)',
                pageSize: 1,
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            })

            if (searchRes.data.files && searchRes.data.files.length > 0) {
                finalParentId = searchRes.data.files[0].id!
            } else {
                // Create it
                const createRes = await drive.files.create({
                    requestBody: {
                        name: formTitle,
                        mimeType: 'application/vnd.google-apps.folder'
                    },
                    fields: 'id',
                    supportsAllDrives: true
                })
                finalParentId = createRes.data.id!
            }
        }

        // 1. Check/Create "Form Assets" folder inside finalParentId
        let assetsFolderId = ''
        const folderQuery = `name = 'Form Assets' and '${finalParentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`

        const folderRes = await drive.files.list({
            q: folderQuery,
            fields: 'files(id)',
            pageSize: 1,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        })

        if (folderRes.data.files && folderRes.data.files.length > 0) {
            assetsFolderId = folderRes.data.files[0].id!
        } else {
            // Create folder
            const createRes = await drive.files.create({
                requestBody: {
                    name: 'Form Assets',
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [finalParentId]
                },
                fields: 'id',
                supportsAllDrives: true
            })
            assetsFolderId = createRes.data.id!
        }

        // 2. Upload File
        const buffer = Buffer.from(await file.arrayBuffer())
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)

        const fileRes = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: [assetsFolderId]
            },
            media: {
                mimeType: file.type,
                body: stream
            },
            fields: 'id, webContentLink, webViewLink',
            supportsAllDrives: true
        })

        const fileId = fileRes.data.id!

        // 3. Make Public - with supportsAllDrives for better compatibility
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            },
            supportsAllDrives: true
        })

        // 4. Return URL
        // Use our local proxy to serve the image. This avoids 403s and broken images.
        // The file is still on Drive, but we serve it through our app.
        const proxyUrl = `/api/images/${fileId}`

        const viewUrl = `https://drive.google.com/file/d/${fileId}/view`

        return NextResponse.json({
            url: proxyUrl,
            viewUrl: viewUrl,
            fileId: fileId,
            folderId: finalParentId
        })

    } catch (error) {
        console.error('Drive upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload to Drive. Make sure you are authenticated.' },
            { status: 500 }
        )
    }
}
