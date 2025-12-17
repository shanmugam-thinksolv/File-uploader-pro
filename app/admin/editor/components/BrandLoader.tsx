import React from 'react'

export function BrandLoader({ className = "w-12 h-12" }: { className?: string }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping"></div>

            {/* Rotating gradient border */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-600 border-r-primary-400 animate-spin"></div>

            {/* Inner pulsing core */}
            <div className="absolute w-1/2 h-1/2 bg-primary-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>

            {/* Floating particles (simulated with dots) */}
            <div className="absolute -top-1 left-1/2 w-1 h-1 bg-primary-400 rounded-full animate-bounce delay-75"></div>
            <div className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary-400 rounded-full animate-bounce delay-150"></div>
        </div>
    )
}
