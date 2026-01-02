'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import SubscriptionPlans from './SubscriptionPlans';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
    highlightPlan?: 'pro' | 'ultra';
}

export default function UpgradeModal({ isOpen, onClose, reason, highlightPlan = 'pro' }: UpgradeModalProps) {
    const { userData, user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (planId: 'free' | 'pro' | 'ultra') => {
        if (planId === 'free') return; // Cannot "upgrade" to free in this modal context usually, or we treat it as close

        if (!userData?.id || !user) {
            toast.error(t('common.error'));
            return;
        }

        setLoading(planId);
        try {
            const token = await user.getIdToken();

            // Map plan to Stripe Price ID (TEST IDs - Replace with real ones from env or config)
            // Ideally this should be server-side or in a config file
            const priceIds = {
                pro: 'price_pro_subscription', // specific logic needed for monthly/yearly in SubscriptionPlans?
                ultra: 'price_ultra_subscription'
            };

            // NOTE: SubscriptionPlans handles "monthly" vs "yearly" state internally.
            // If we need to know which billing period was selected, SubscriptionPlans needs to expose it 
            // OR we move the state up.
            // For now, let's assume we proceed to a checkout page where user confirms details, 
            // OR we just trigger the monthly default.

            // actually, SubscriptionPlans component doesn't expose billing period state.
            // Use this strictly for UI consistency for now.
            // TODO: Refactor SubscriptionPlans to lift state up if we need exact billing period here.

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planId: planId
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || t('common.error'));
            }
        } catch (e) {
            console.error(e);
            toast.error(t('common.error'));
        } finally {
            setLoading(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 text-center border-b border-slate-800">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{t('subscription.title')}</h2>
                        <p className="text-slate-400">{reason || t('subscription.subtitle')}</p>
                    </div>

                    {/* Plans */}
                    <div className="p-6">
                        <SubscriptionPlans onSelect={handleUpgrade} />
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 text-center">
                        <p className="text-xs text-slate-500">
                            {t('subscription.disclaimer')}
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}


