import React from "react";

// extends standard HTML button to preserve native DOM behavior
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function Button({ children, onClick, className="", disabled, ...props}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}