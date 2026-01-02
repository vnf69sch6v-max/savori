'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    CreditCard,
    Sparkles,
    Shield,
    Zap,
    BarChart3,
    Brain,
    TrendingUp,
    Clock,
    Check
} from 'lucide-react';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/lib/subscription-service';
import toast from 'react-hot-toast';

const PRO_FEATURES = [
    { icon: Brain, label: 'AI Insights', description: 'Personalizowane porady od AI' },
    { icon: BarChart3, label: 'Benchmarki', description: 'Porównaj się z innymi' },
    { icon: TrendingUp, label: 'Money Wrapped', description: 'Podsumowania w stylu Spotify' },
    { icon: Clock, label: 'Pre-Purchase Pause', description: '24h pauza na przemyślenie' },
];

export default function BillingPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { userData } = useAuth();

    const handleSelectPlan = async (plan: 'free' | 'pro' | 'ultra') => {
        if (!userData?.id) return;

        if (plan === 'free') {
            if (confirm(t('subscription.confirmDowngrade'))) {
                const toastId = toast.loading(t('settings.updating'));
                try {
                    await subscriptionService.upgradeSubscription(userData.id, 'free');
                    toast.success(t('settings.planUpdated'), { id: toastId });
                    window.location.reload();
                } catch (error) {
                    toast.error(t('common.error'), { id: toastId });
                }
            }
            return;
        }

        // For Pro/Ultra, we would normally integration with Stripe here
        // For now, we simulate upgrade
        const toastId = toast.loading(t('settings.updating'));
        try {
            await subscriptionService.upgradeSubscription(userData.id, plan);
            toast.success(t('settings.planUpdated'), { id: toastId });
            router.push('/settings/billing/success');
        } catch (error) {
            toast.error(t('common.error'), { id: toastId });
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-24 lg:pb-0 px-4">
            <button
                onClick={() => router.back()}
                className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
            </button>

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600/20 via-slate-900 to-purple-600/20 border border-emerald-500/20 p-8 md:p-12 mb-10"
            >
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-6"
                    >
                        <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>

                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        Odblokuj pełen potencjał
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                        Zaawansowana analityka, AI insights i narzędzia do świadomego zarządzania finansami.
                    </p>

                    {/* Feature highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        {PRO_FEATURES.map((feature, i) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                            >
                                <feature.icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-white">{feature.label}</p>
                                <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Plans */}
            <SubscriptionPlans onSelect={handleSelectPlan} />

            {/* Trust badges */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-6 mt-12 mb-8"
            >
                <div className="flex items-center gap-2 text-slate-400">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">Bezpieczne płatności</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-sm">Natychmiastowa aktywacja</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Check className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">Anuluj kiedy chcesz</span>
                </div>
            </motion.div>

            <p className="text-center text-xs text-slate-500 mb-8">
                {t('subscription.disclaimer')}
            </p>
        </div>
    );
}

