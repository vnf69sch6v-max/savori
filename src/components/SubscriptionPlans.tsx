'use client';

/**
 * SubscriptionPlans
 * Beautiful 3-tier subscription comparison component
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, Crown, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const PRICING = {
    pro: { monthly: 1999, yearly: 14900 }, // in grosze
    ultra: { monthly: 3999, yearly: 34900 },
};

const FEATURES = [
    { key: 'budgets', free: '1', pro: '5', ultra: '∞' },
    { key: 'goals', free: '1', pro: '5', ultra: '∞' },
    { key: 'aiInsights', free: false, pro: true, ultra: true },
    { key: 'aiChat', free: '5', pro: '50', ultra: '∞' },
    { key: 'scanning', free: '3', pro: '30', ultra: '∞' },
    { key: 'export', free: 'PDF', pro: 'PDF + CSV', ultra: 'All' },
    { key: 'reports', free: false, pro: true, ultra: true },
    { key: 'support', free: 'community', pro: 'email', ultra: 'priority' },
    { key: 'badge', free: false, pro: '⭐', ultra: '💎' },
];

interface SubscriptionPlansProps {
    onSelect?: (plan: 'free' | 'pro' | 'ultra') => void;
}

export default function SubscriptionPlans({ onSelect }: SubscriptionPlansProps) {
    const { userData } = useAuth();
    const { t } = useLanguage();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

    const currentPlan = userData?.subscription?.plan || 'free';

    const formatPrice = (cents: number) => {
        return (cents / 100).toFixed(2).replace('.', ',') + ' zł';
    };

    const getYearlySavings = (plan: 'pro' | 'ultra') => {
        const monthlyCost = PRICING[plan].monthly * 12;
        const yearlyCost = PRICING[plan].yearly;
        return Math.round((1 - yearlyCost / monthlyCost) * 100);
    };

    return (
        <div className="space-y-6">
            {/* Billing Toggle */}
            <div className="flex justify-center">
                <div className="bg-slate-800/50 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            billingPeriod === 'monthly'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        )}
                    >
                        {t('subscription.monthly')}
                    </button>
                    <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                            billingPeriod === 'yearly'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        )}
                    >
                        {t('subscription.yearly')}
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                            -{getYearlySavings('pro')}%
                        </span>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className={cn(
                        'relative rounded-2xl p-6 border transition-all',
                        currentPlan === 'free'
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    )}
                >
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">Free</h3>
                            <p className="text-sm text-slate-400">{t('subscription.free.description')}</p>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">0 zł</span>
                            <span className="text-slate-400">{t('subscription.perMonth')}</span>
                        </div>

                        <Button
                            variant={currentPlan === 'free' ? 'outline' : 'secondary'}
                            className="w-full"
                            disabled={currentPlan === 'free'}
                            onClick={() => onSelect?.('free')}
                        >
                            {currentPlan === 'free' ? t('subscription.currentPlan') : 'Zmień na Free'}
                        </Button>

                        <ul className="space-y-3 pt-4 border-t border-slate-700">
                            {FEATURES.map((feature) => (
                                <li key={feature.key} className="flex items-center gap-3 text-sm">
                                    {feature.free ? (
                                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    ) : (
                                        <X className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                    )}
                                    <span className={feature.free ? 'text-slate-300' : 'text-slate-500'}>
                                        {t(`subscription.features.${feature.key}` as any)}: {feature.free || '-'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                {/* Pro Plan */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        'relative rounded-2xl p-6 border-2 transition-all',
                        currentPlan === 'pro'
                            ? 'border-emerald-500 bg-gradient-to-b from-emerald-500/20 to-slate-800/50'
                            : 'border-emerald-500/50 bg-gradient-to-b from-emerald-500/10 to-slate-800/50 hover:border-emerald-500'
                    )}
                >
                    {/* Popular Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {t('subscription.pro.badge')}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                                Pro
                            </h3>
                            <p className="text-sm text-slate-400">{t('subscription.pro.description')}</p>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">
                                {formatPrice(billingPeriod === 'monthly' ? PRICING.pro.monthly : Math.round(PRICING.pro.yearly / 12))}
                            </span>
                            <span className="text-slate-400">{t('subscription.perMonth')}</span>
                        </div>

                        {billingPeriod === 'yearly' && (
                            <p className="text-xs text-emerald-400">
                                {t('subscription.save')} {getYearlySavings('pro')}% • {formatPrice(PRICING.pro.yearly)}{t('subscription.perYear')}
                            </p>
                        )}

                        <Button
                            variant={currentPlan === 'pro' ? 'outline' : 'primary'}
                            className="w-full"
                            onClick={() => onSelect?.('pro')}
                            disabled={currentPlan === 'pro'}
                        >
                            {currentPlan === 'pro' ? t('subscription.currentPlan') : t('subscription.upgrade')}
                        </Button>

                        <ul className="space-y-3 pt-4 border-t border-slate-700">
                            {FEATURES.map((feature) => (
                                <li key={feature.key} className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-slate-300">
                                        {t(`subscription.features.${feature.key}` as any)}: {feature.pro}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                {/* Ultra Plan */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        'relative rounded-2xl p-6 border-2 transition-all',
                        currentPlan === 'ultra'
                            ? 'border-purple-500 bg-gradient-to-b from-purple-500/20 to-slate-800/50'
                            : 'border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-slate-800/50 hover:border-purple-500'
                    )}
                >
                    {/* Best Value Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            {t('subscription.ultra.badge')}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-purple-400" />
                                Ultra
                            </h3>
                            <p className="text-sm text-slate-400">{t('subscription.ultra.description')}</p>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">
                                {formatPrice(billingPeriod === 'monthly' ? PRICING.ultra.monthly : Math.round(PRICING.ultra.yearly / 12))}
                            </span>
                            <span className="text-slate-400">{t('subscription.perMonth')}</span>
                        </div>

                        {billingPeriod === 'yearly' && (
                            <p className="text-xs text-purple-400">
                                {t('subscription.save')} {getYearlySavings('ultra')}% • {formatPrice(PRICING.ultra.yearly)}{t('subscription.perYear')}
                            </p>
                        )}

                        <Button
                            variant={currentPlan === 'ultra' ? 'outline' : 'secondary'}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 border-0"
                            onClick={() => onSelect?.('ultra')}
                            disabled={currentPlan === 'ultra'}
                        >
                            {currentPlan === 'ultra' ? t('subscription.currentPlan') : t('subscription.upgrade')}
                        </Button>

                        <ul className="space-y-3 pt-4 border-t border-slate-700">
                            {FEATURES.map((feature) => (
                                <li key={feature.key} className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-slate-300">
                                        {t(`subscription.features.${feature.key}` as any)}: {feature.ultra}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
