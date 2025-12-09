"use client"

import { useEffect, useState } from 'react';

export function PickerDebug() {
    const [debugInfo, setDebugInfo] = useState<any>({});

    useEffect(() => {
        const info: any = {
            apiKeyPresent: !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
            apiKeyLength: process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.length || 0,
            apiKeyPrefix: process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.substring(0, 10) || 'N/A',
            gapiAvailable: typeof window !== 'undefined' && !!window.gapi,
            googleAvailable: typeof window !== 'undefined' && !!window.google,
            pickerAvailable: typeof window !== 'undefined' && !!window.google?.picker,
        };

        setDebugInfo(info);
    }, []);

    if (process.env.NODE_ENV === 'production') {
        return null; // Don't show in production
    }

    return (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs font-mono max-w-md z-50 shadow-lg">
            <div className="font-bold mb-2 text-yellow-800">🔍 Picker Debug Info</div>
            <div className="space-y-1 text-yellow-700">
                <div>API Key: {debugInfo.apiKeyPresent ? '✅ Present' : '❌ Missing'}</div>
                <div>API Key Length: {debugInfo.apiKeyLength}</div>
                <div>API Key Starts: {debugInfo.apiKeyPrefix}</div>
                <div>gapi: {debugInfo.gapiAvailable ? '✅' : '❌'}</div>
                <div>google: {debugInfo.googleAvailable ? '✅' : '❌'}</div>
                <div>picker: {debugInfo.pickerAvailable ? '✅' : '❌'}</div>
            </div>
            {!debugInfo.apiKeyPresent && (
                <div className="mt-2 text-red-600 font-bold">
                    ⚠️ Add NEXT_PUBLIC_GOOGLE_API_KEY to .env and restart!
                </div>
            )}
        </div>
    );
}

