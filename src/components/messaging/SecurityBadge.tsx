'use client';

/**
 * SecurityBadge - Trust indicator for data security
 * Small, unobtrusive badge to reassure users about data safety
 */

import { motion } from 'framer-motion';
import { Shield, Lock, ShieldCheck } from 'lucide-react';

interface SecurityBadgeProps {
    className?: string;
    variant?: 'default' | 'inline' | 'minimal';
    message?: string;
}

export default function SecurityBadge({
    className = '',
    variant = 'default',
    message
}: SecurityBadgeProps) {

    if (variant === 'minimal') {
        return (
            <div className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
                <Lock className="w-3 h-3" />
                <span>Szyfrowane end-to-end</span>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 ${className}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                    {message || 'Dane szyfrowane'}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 ${className}`}
        >
            <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
                <p className="text-sm text-slate-300">
                    {message || '🔒 Twoje dane są szyfrowane i nigdy nie opuszczają Twojego konta.'}
                </p>
            </div>
        </motion.div>
    );
}
