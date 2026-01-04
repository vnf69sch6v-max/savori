'use client';

/**
 * ProUpgradeBanner - Single elegant upgrade prompt for free users
 * Replaces multiple ugly lock icons with one appealing banner
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Brain, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface ProUpgradeBannerProps {
    className?: string;
    variant?: 'full' | 'compact' | 'minimal';
}

const PRO_FEATURES = [
    { icon: Brain, label: 'AI Insights' },
    { icon: TrendingUp, label: 'Prognozy' },
    { icon: Sparkles, label: 'Smart Tips' },
];

export default function ProUpgradeBanner({
    className = '',
    variant = 'full'
}: ProUpgradeBannerProps) {
    const { isPro } = useSubscription();

    // Don't show for Pro users
    if (isPro) return null;

    if (variant === 'minimal') {
        return (
            <Link href="/subscriptions">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium ${className}`}
                >
                    <Sparkles className="w-4 h-4" />
                    Odblokuj Pro
                </motion.div>
            </Link>
        );
    }

    if (variant === 'compact') {
        return (
            <Link href="/subscriptions">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 ${className}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/20">
                                <Zap className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Odblokuj AI funkcje</p>
                                <p className="text-xs text-slate-400">od 12,42 zł/msc</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-emerald-400" />
                    </div>
                </motion.div>
            </Link>
        );
    }

    // Full variant
    return (
        <Link href="/subscriptions">
            <motion.div
                whileHover={{ scale: 1.01 }}
                className={`relative overflow-hidden rounded-2xl ${className}`}
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />

                {/* Animated glow effect */}
                <motion.div
                    animate={{
                        x: ['-100%', '200%'],
                        opacity: [0, 0.3, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-12"
                />

                <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-white" />
                        <span className="text-sm font-medium text-white/80">Savori Pro</span>
                    </div>

                    {/* Main message */}
                    <h3 className="text-xl font-bold text-white mb-2">
                        Odblokuj pełną moc AI 🚀
                    </h3>
                    <p className="text-sm text-white/80 mb-4">
                        Inteligentne prognozy, alerty i personalizowane porady oszczędnościowe.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {PRO_FEATURES.map((feature) => (
                            <div
                                key={feature.label}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs text-white"
                            >
                                <feature.icon className="w-3 h-3" />
                                {feature.label}
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="flex flex-wrap gap-y-2 items-center justify-between">
                        <span className="text-sm text-white/70">
                            od <span className="font-semibold text-white">12,42 zł</span>/msc
                        </span>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-emerald-600 font-semibold text-sm whitespace-nowrap">
                            Zobacz plany
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
