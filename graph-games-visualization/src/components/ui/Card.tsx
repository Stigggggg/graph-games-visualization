import React from "react";

// ReactNode - accepts any valid React element as children for component composition
interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className=""}: CardProps) {
    return (
        <div className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center text-center ${className}`}>
            {children}
        </div>
    );
}