import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

    const variants = {
        primary: `
      bg-gradient-to-r from-emerald-500 to-emerald-600
      hover:from-emerald-400 hover:to-emerald-500
      text-white shadow-lg shadow-emerald-500/25
      focus:ring-emerald-500
    `,
        secondary: `
      bg-slate-700 hover:bg-slate-600
      text-white
      focus:ring-slate-500
    `,
        outline: `
      border-2 border-slate-600 hover:border-emerald-500
      text-slate-200 hover:text-emerald-400
      bg-transparent
      focus:ring-emerald-500
    `,
        ghost: `
      text-slate-300 hover:text-white
      hover:bg-slate-800
      focus:ring-slate-500
    `,
        danger: `
      bg-red-600 hover:bg-red-500
      text-white
      focus:ring-red-500
    `,
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : icon ? (
                icon
            ) : null}
            {children}
        </button>
    );
}
