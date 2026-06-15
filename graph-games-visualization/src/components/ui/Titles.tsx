import React from "react";

// ReactNode - accepts any valid React element as children for component composition
export interface TitleProps {
    children: React.ReactNode;
    className?: string;
}

export function Title({ children, className="" }: TitleProps) {
    return (
        <h1 className={`text-5xl md:text-6xl font-extrabold text-blue-600 tracking-tight ${className}`}>
            {children}
        </h1>
    );
}

export function Subtitle({ children, className="" }: TitleProps) {
    return (
        <h2 className={`text-2xl font-bold text-gray-800 ${className}`}>
            {children}
        </h2>
    )
}