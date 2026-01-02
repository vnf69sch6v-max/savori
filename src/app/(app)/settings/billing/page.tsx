'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import SubscriptionPlans from '@/components/SubscriptionPlans';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService } from '@/lib/subscription-service';
import toast from 'react-hot-toast';

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
        <div className="max-w-4xl mx-auto pb-24 lg:pb-0 px-4">
            <button
                onClick={() => router.back()}
                className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back')}
            </button>

            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                    <CreditCard className="w-8 h-8 text-emerald-400" />
                    {t('settings.subscription')}
                </h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                    {t('subscription.upgradeDescription')}
                </p>
            </div>

            <SubscriptionPlans onSelect={handleSelectPlan} />

            <p className="text-center text-xs text-slate-500 mt-12 mb-8">
                {t('subscription.disclaimer')}
            </p>
        </div>
    );
}
