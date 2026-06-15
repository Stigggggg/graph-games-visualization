import React from "react";

// base interfaces extending native form elements for seamless React integration
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ children, className="", ...props }: LabelProps) {
    return (
        <label 
            className={`w-full font-semibold text-gray-700 flex flex-col items-center ${className}`}
            {...props}
        >
            {children}
        </label>
    );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className="", ...props }: InputProps) {
    return (
        <input
            className={`p-2 border border-gray-300 rounded-md text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full ${className}`}
            {...props}
        >
        </input>
    );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ children, className="", ...props }: SelectProps) {
    return (
        <select
            {...props}
            className={`p-2 border border-gray-300 rounded-md text-base mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full ${className}`}
        >
            {children}
        </select>
    )
}