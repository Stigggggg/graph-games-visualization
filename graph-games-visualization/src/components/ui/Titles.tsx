import React from "react";

// Interface defining the properties for titles and subtitles

export interface TitleProps {
    children: React.ReactNode; // text to display
    className?: string; // possibility to add custom CSS classes
}

// Main title component
export function Title({ children, className="" }: TitleProps) {
    return (
        <h1 className={`text-5xl md:text-6xl font-extrabold text-blue-600 tracking-tight ${className}`}>
            {children}
        </h1>
    );
}

// Secondary title component, used for section titles and graph labels
export function Subtitle({ children, className="" }: TitleProps) {
    return (
        <h2 className={`text-2xl font-bold text-gray-800 ${className}`}>
            {children}
        </h2>
    )
}