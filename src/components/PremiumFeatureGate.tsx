'use client';

/**
 * PremiumFeatureGate
 * Wraps features that require paid plans
 * Shows content but with upgrade overlay for free users
 */

import { motion } from 'framer-motion';
import { Lock, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';

export type RequiredPlan = 'pro' | 'ultra';

interface PremiumFeatureGateProps {
    children: React.ReactNode;
    requiredPlan: RequiredPlan;
    featureName: string;
    /** 
     * If true, render blurred preview of content for non-paying users.
     * WARNING: This still executes the children! Use only for static content.
     * Default: false (children are NOT rendered for non-paying users)
     */
    renderBlocked?: boolean;
    className?: string;
}

const PLAN_CONFIG = {
    pro: {
        label: 'Pro',
        icon: Sparkles,
        color: 'from-emerald-500 to-teal-500',
        borderColor: 'border-emerald-500/50',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
    },
    ultra: {
        label: 'Ultra',
        icon: Crown,
        color: 'from-purple-500 to-pink-500',
        borderColor: 'border-purple-500/50',
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
    },
};

export default function PremiumFeatureGate({
    children,
    requiredPlan,
    featureName,
    renderBlocked = false,
    className = '',
}: PremiumFeatureGateProps) {
    const { plan, isPro, isPremium } = useSubscription();
    const router = useRouter();

    // Check if user has required plan
    const hasAccess = requiredPlan === 'pro'
        ? (isPro || isPremium)
        : isPremium;

    // If user has access, just render children
    if (hasAccess) {
        return <>{children}</>;
    }

    const config = PLAN_CONFIG[requiredPlan];
    const Icon = config.icon;

    const handleUpgrade = () => {
        router.push('/settings/billing');
    };

    // If renderBlocked is false (default), do NOT render children at all
    // This prevents API calls from components that are gated
    if (!renderBlocked) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl border ${config.borderColor} ${config.bgColor} p-8 ${className}`}
            >
                <UpgradePrompt
                    config={config}
                    Icon={Icon}
                    featureName={featureName}
                    onUpgrade={handleUpgrade}
                />
            </motion.div>
        );
    }

    // Only render blurred preview if explicitly requested (for static content only!)
    return (
        <div className={`relative ${className}`}>
            <div className="relative overflow-hidden rounded-2xl">
                {/* Blurred content preview - WARNING: children still execute! */}
                <div className="blur-sm pointer-events-none select-none opacity-60">
                    {children}
                </div>

                {/* Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-slate-900/60 flex flex-col items-center justify-center p-6"
                >
                    <UpgradePrompt
                        config={config}
                        Icon={Icon}
                        featureName={featureName}
                        onUpgrade={handleUpgrade}
                    />
                </motion.div>
            </div>
        </div>
    );
}

// Upgrade prompt content
function UpgradePrompt({
    config,
    Icon,
    featureName,
    onUpgrade,
}: {
    config: typeof PLAN_CONFIG['pro'];
    Icon: typeof Sparkles;
    featureName: string;
    onUpgrade: () => void;
}) {
    return (
        <div className="text-center max-w-xs">
            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${config.color} mb-4`}
            >
                <Lock className="w-6 h-6 text-white" />
            </motion.div>

            {/* Title */}
            <h4 className="text-lg font-bold text-white mb-2">
                {featureName}
            </h4>

            {/* Description */}
            <p className="text-sm text-slate-400 mb-4">
                Ta funkcja jest dostępna w planie{' '}
                <span className={`font-semibold ${config.textColor}`}>
                    {config.label}
                </span>
            </p>

            {/* Upgrade button */}
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={onUpgrade}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${config.color} text-white font-semibold shadow-lg hover:shadow-xl transition-shadow`}
            >
                <Icon className="w-4 h-4" />
                Odblokuj {config.label}
                <ArrowRight className="w-4 h-4" />
            </motion.button>

            {/* Price hint */}
            <p className="text-xs text-slate-500 mt-3">
                Już od 12,42 zł/msc
            </p>
        </div>
    );
}

// Compact badge for inline Pro indicators
export function ProBadge({
    plan = 'pro',
    onClick,
    className = ''
}: {
    plan?: RequiredPlan;
    onClick?: () => void;
    className?: string;
}) {
    const config = PLAN_CONFIG[plan];
    const Icon = config.icon;
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push('/settings/billing');
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${config.color} text-white text-[10px] font-bold ${className}`}
        >
            <Icon className="w-3 h-3" />
            {config.label}
        </motion.button>
    );
}
