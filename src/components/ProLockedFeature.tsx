'use client';

/**
 * ProLockedFeature
 * Shows a lock overlay when a feature requires Pro subscription
 */

import { motion } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface ProLockedFeatureProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export default function ProLockedFeature({ title, description, icon }: ProLockedFeatureProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-5"
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Lock icon container */}
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        {icon || <Lock className="w-6 h-6 text-amber-400" />}
                    </div>

                    {/* Text */}
                    <div>
                        <h3 className="font-semibold text-white">{title}</h3>
                        <p className="text-sm text-slate-400">{description}</p>
                    </div>
                </div>

                {/* Pro button */}
                <Link href="/settings#subscription">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow whitespace-nowrap"
                    >
                        <Zap className="w-4 h-4" />
                        Pro
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}
