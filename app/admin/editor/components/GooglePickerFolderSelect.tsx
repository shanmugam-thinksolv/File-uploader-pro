"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Folder, HardDrive, Loader2, Info, X, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiDriveLine } from "react-icons/ri";
import { EditorFormData } from "../types";

interface GooglePickerFolderSelectProps {
    formData: EditorFormData;
    updateField: <K extends keyof EditorFormData>(field: K, value: EditorFormData[K]) => void;
}

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

export function GooglePickerFolderSelect({ formData, updateField }: GooglePickerFolderSelectProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [pickerReady, setPickerReady] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showChangeTooltip, setShowChangeTooltip] = useState(false);
    const [showSetDefaultTooltip, setShowSetDefaultTooltip] = useState(false);
    const changeTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const setDefaultTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Load the Google Picker API
        const loadGooglePicker = () => {
            // Check if already loaded
            if (window.gapi && window.google) {
                window.gapi.load('picker', () => {
                    setPickerReady(true);
                });
                return;
            }

            // Load Google API script
            const script1 = document.createElement('script');
            script1.src = 'https://apis.google.com/js/api.js';
            script1.async = true;
            script1.defer = true;
            script1.onload = () => {
                if (window.gapi) {
                    window.gapi.load('picker', {
                        callback: () => {
                            console.log('Google Picker API loaded successfully');
                            setPickerReady(true);
                        },
                        onerror: (error: any) => {
                            console.error('Failed to load Google Picker:', error);
                        }
                    });
                }
            };
            script1.onerror = () => {
                console.error('Failed to load Google API script');
            };
            document.body.appendChild(script1);
        };

        loadGooglePicker();
    }, []);

    const openPicker = async () => {
        if (!pickerReady) {
            alert('Google Picker is still loading. Please try again in a moment.');
            return;
        }

        // Check if Google Picker API is actually available
        if (!window.google || !window.google.picker) {
            console.error('Google Picker API not available');
            alert('Google Picker API failed to load. Please refresh the page and try again.');
            return;
        }

        // Check if API key is configured
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
            console.error('Google API Key is missing');
            alert('Google API Key is not configured. Please add NEXT_PUBLIC_GOOGLE_API_KEY to your .env file and restart the server.');
            return;
        }

        setIsLoading(true);

        try {
            // Get the access token from the session
            const tokenResponse = await fetch('/api/drive/token');
            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json().catch(() => ({}));

                // If re-authentication is required, show helpful message
                if (errorData.requiresReauth) {
                    const message = errorData.error || 'Authentication required';
                    alert(`${message}\n\nPlease:\n1. Sign out from your account\n2. Sign in again with Google\n3. Grant Drive permissions\n4. Try the picker again`);
                    setIsLoading(false);
                    return;
                }

                throw new Error(errorData.error || errorData.details || 'Failed to get access token. Please sign in with Google.');
            }

            const { accessToken, refreshed } = await tokenResponse.json();

            if (!accessToken) {
                throw new Error('No access token received. Please sign out and sign in again with Google to grant Drive permissions.');
            }

            if (refreshed) {
                console.log('✅ Access token refreshed successfully');
            }

            console.log('Opening Google Picker with API key:', apiKey.substring(0, 10) + '...');
            console.log('Access token present:', !!accessToken);
            console.log('Origin:', window.location.protocol + '//' + window.location.host);

            // Scroll to top before opening picker so users can see it
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Create and show the picker with both My Drive and Shared Drives support
            const picker = new window.google.picker.PickerBuilder()
                .enableFeature(window.google.picker.Feature.SUPPORT_DRIVES)
                .addView(
                    new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
                        .setSelectFolderEnabled(true)
                        .setMimeTypes('application/vnd.google-apps.folder')
                )
                .addView(
                    new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
                        .setSelectFolderEnabled(true)
                        .setEnableDrives(true)
                        .setIncludeFolders(true)
                        .setMimeTypes('application/vnd.google-apps.folder')
                )
                .setOAuthToken(accessToken)
                .setDeveloperKey(apiKey)
                .setCallback(pickerCallback)
                .setTitle('Select Destination Folder')
                .setOrigin(window.location.origin) // Use origin instead of protocol + host
                .build();

            // Small delay to ensure scroll completes before showing picker
            setTimeout(() => {
            picker.setVisible(true);
            }, 100);
        } catch (error: any) {
            console.error('Error opening picker:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                apiKey: apiKey ? 'Present' : 'Missing',
                pickerReady,
                googleAvailable: !!window.google,
                pickerAvailable: !!window.google?.picker
            });

            // Provide helpful error message
            let errorMessage = error.message || 'Failed to open folder picker.';

            if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                errorMessage = 'Google Picker API access denied.\n\nPlease check:\n1. Google Picker API is enabled in Google Cloud Console\n2. API key has correct restrictions\n3. You are signed in with Google\n4. Try signing out and signing in again';
            } else if (error.message?.includes('token') || error.message?.includes('auth')) {
                errorMessage = 'Authentication error.\n\nPlease:\n1. Sign out from your account\n2. Sign in again with Google\n3. Grant Drive permissions when prompted\n4. Try the picker again';
            }

            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const pickerCallback = (data: any) => {
        console.log('Picker callback:', data);

        if (data.action === window.google.picker.Action.PICKED) {
            const folder = data.docs[0];
            console.log('Folder selected:', folder);
            console.log('Full folder object:', JSON.stringify(folder, null, 2));

            // Detect if this is a shared drive folder
            // Shared drive items have a driveId property
            // Check multiple properties to ensure accurate detection
            const hasDriveId = !!folder.driveId;
            const driveId = folder.driveId || null;
            
            // Log all relevant properties for debugging
            console.log('Drive ID:', driveId);
            console.log('Has driveId:', hasDriveId);
            console.log('Folder ID:', folder.id);
            console.log('Folder URL:', folder.url);
            console.log('Folder name:', folder.name);
            
            // Check if URL contains shared drive indicators
            const urlIndicatesSharedDrive = folder.url && (
                folder.url.includes('drive.google.com/drive/folders/') ||
                folder.url.includes('shared-drive')
            );

            // Determine drive type: if driveId exists, it's definitely a shared drive
            const isSharedDrive = hasDriveId;
            
            console.log('Is Shared Drive (final):', isSharedDrive);
            console.log('URL indicates shared drive:', urlIndicatesSharedDrive);

            updateField('driveFolderId', folder.id);
            updateField('driveFolderName', folder.name);
            updateField('driveFolderUrl', folder.url);
            updateField('driveType', isSharedDrive ? 'SHARED_DRIVE' : 'MY_DRIVE');

            if (isSharedDrive && driveId) {
                updateField('sharedDriveId', driveId);
            } else {
                updateField('sharedDriveId', '');
            }
        } else if (data.action === window.google.picker.Action.CANCEL) {
            console.log('Picker cancelled by user');
        } else {
            console.warn('Unknown picker action:', data.action);
        }
    };

    const setDefaultFolder = () => {
        updateField('driveFolderId', "");
        updateField('driveFolderName', "");
        updateField('driveFolderUrl', "");
    };

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between">
                <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium flex items-center gap-2"> <RiDriveLine className="w-6 h-6 text-primary-700" /> Google Drive Storage</Label>
                        <Tooltip>
                            <TooltipTrigger
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                                className="text-primary-600 hover:text-primary-700 transition-colors mt-1.5 cursor-help"
                            >
                                <Info className="w-4 h-4" />
                            </TooltipTrigger>
                            {showTooltip && (
                                <TooltipContent>
                                    <p className="leading-relaxed">
                                        By default, a new folder will be created automatically in your Google Drive for this form.
                                        If you want to save files to a specific existing folder, you can select one using the button.
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                    {formData.driveFolderName ? (
                            <p className="text-sm text-muted-foreground">
                            Files will be saved to your selected folder
                            {formData.driveType === 'SHARED_DRIVE' && (
                                <span className="ml-1 font-medium" style={{ color: 'var(--primary-600)' }}>(Shared Drive)</span>
                            )}
                            {formData.driveType === 'MY_DRIVE' && (
                                <span className="ml-1 text-gray-600 font-medium">(My Drive)</span>
                            )}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                            By default, files are saved in a new &quot;File Uploader Pro&quot; folder in your Google Drive.
                        </p>
                    )}
                </div>

                        {formData.driveFolderName ? (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-100">
                            <Folder className="w-4 h-4" />
                            <span className="font-medium truncate max-w-[150px]">{formData.driveFolderName}</span>
                        </div>
                        {formData.driveType === 'SHARED_DRIVE' && (
                            <div className="flex items-center gap-1 text-xs bg-primary-50 px-2 py-1 rounded-md border border-primary-100" style={{ color: 'var(--primary-600)' }}>
                                <HardDrive className="w-3 h-3" />
                                <span className="font-medium">Shared Drive</span>
                            </div>
                        )}
                        {/* {formData.driveType === 'MY_DRIVE' && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                <HardDrive className="w-3 h-3" />
                                <span className="font-medium">My Drive</span>
                            </div>
                        )} */}
                        <Tooltip>
                            <div
                                onMouseEnter={() => {
                                    // Clear any existing timeout
                                    if (changeTooltipTimeoutRef.current) {
                                        clearTimeout(changeTooltipTimeoutRef.current)
                                    }
                                    // Set timeout to show tooltip after 500ms
                                    changeTooltipTimeoutRef.current = setTimeout(() => {
                                        setShowChangeTooltip(true)
                                    }, 500)
                                }}
                                onMouseLeave={() => {
                                    // Clear timeout if mouse leaves before timeout
                                    if (changeTooltipTimeoutRef.current) {
                                        clearTimeout(changeTooltipTimeoutRef.current)
                                        changeTooltipTimeoutRef.current = null
                                    }
                                    setShowChangeTooltip(false)
                                }}
                                className="relative inline-block"
                            >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openPicker}
                            disabled={isLoading}
                            className="gap-2"
                                    style={{ borderColor: 'var(--primary-600)', color: 'var(--primary-600)' }}
                        >
                                    {/* <RefreshCw className="w-4 h-4" /> */}
                            Change
                        </Button>
                                {showChangeTooltip && (
                                    <TooltipContent className="w-auto whitespace-nowrap">
                                        <p>Change selected folder</p>
                                    </TooltipContent>
                                )}
                            </div>
                        </Tooltip>
                        <Tooltip>
                            <div
                                onMouseEnter={() => {
                                    // Clear any existing timeout
                                    if (setDefaultTooltipTimeoutRef.current) {
                                        clearTimeout(setDefaultTooltipTimeoutRef.current)
                                    }
                                    // Set timeout to show tooltip after 500ms
                                    setDefaultTooltipTimeoutRef.current = setTimeout(() => {
                                        setShowSetDefaultTooltip(true)
                                    }, 500)
                                }}
                                onMouseLeave={() => {
                                    // Clear timeout if mouse leaves before timeout
                                    if (setDefaultTooltipTimeoutRef.current) {
                                        clearTimeout(setDefaultTooltipTimeoutRef.current)
                                        setDefaultTooltipTimeoutRef.current = null
                                    }
                                    setShowSetDefaultTooltip(false)
                                }}
                                className="relative inline-block"
                            >
                        <Button
                                    variant="outline"
                            size="sm"
                                    onClick={setDefaultFolder}
                                    className="gap-2"
                                    style={{ borderColor: '#64748b', color: '#64748b' }}
                        >
                                    Set Default
                        </Button>
                                {showSetDefaultTooltip && (
                                    <TooltipContent className="w-auto whitespace-nowrap">
                                        <p>Reset to default folder</p>
                                    </TooltipContent>
                                )}
                            </div>
                        </Tooltip>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={openPicker}
                        className="gap-2 mt-2"
                        disabled={isLoading || !pickerReady}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <HardDrive className="w-4 h-4 text-primary-600" />
                                Choose a Drive folder (optional)
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}