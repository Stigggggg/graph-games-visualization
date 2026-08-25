import React from "react";

// Interface defining the properties for the Card component
// The component is an universal wrapper for other UI elements
interface CardProps {
    children: React.ReactNode; // content rendered inside the card
    className?: string; // possibility to add custom CSS classes
}

export function Card({ children, className="" }: CardProps) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center text-center ${className}`}>
            {children}
        </div>
    );
}