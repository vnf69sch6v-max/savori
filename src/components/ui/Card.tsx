import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient';
    hover?: boolean;
}

export function Card({
    children,
    className,
    variant = 'default',
    hover = false,
    ...props
}: CardProps) {
    const variants = {
        default: `
      bg-slate-800/50 
      border border-slate-700/50
    `,
        glass: `
      bg-slate-800/30 backdrop-blur-xl
      border border-slate-700/30
    `,
        gradient: `
      bg-gradient-to-br from-slate-800/80 to-slate-900/80
      border border-slate-700/50
    `,
    };

    return (
        <div
            className={cn(
                'rounded-2xl p-5',
                variants[variant],
                hover && 'transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }

export function CardTitle({ children, className, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn('text-lg font-semibold text-white', className)}
            {...props}
        >
            {children}
        </h3>
    );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> { }

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
    return (
        <p className={cn('text-sm text-slate-400 mt-1', className)} {...props}>
            {children}
        </p>
    );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardContent({ children, className, ...props }: CardContentProps) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export function CardFooter({ children, className, ...props }: CardFooterProps) {
    return (
        <div
            className={cn('mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-3', className)}
            {...props}
        >
            {children}
        </div>
    );
}
