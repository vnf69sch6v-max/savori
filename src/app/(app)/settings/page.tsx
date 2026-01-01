'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    User,
    Bell,
    Palette,
    CreditCard,
    LogOut,
    Moon,
    Globe,
    Coins,
    Check,
    X,
    Sparkles,
    Zap,
    Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { subscriptionService, SUBSCRIPTION_PLANS, PlanFeatures } from '@/lib/subscription-service';
import { formatMoney } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
    const router = useRouter();
    const { user, userData, signOut, updateUserData } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    // Profile state (manual save)
    const [displayName, setDisplayName] = useState(userData?.displayName || '');
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        if (userData?.displayName) setDisplayName(userData.displayName);
    }, [userData?.displayName]);

    // Instant save handler for preferences
    const updatePreference = async (key: string, value: any) => {
        if (!userData) return;

        try {
            await updateUserData({
                settings: {
                    ...userData.settings,
                    [key]: value
                }
            });
            toast.success(t('common.saved'));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSavingProfile(true);
            await updateUserData({ displayName });
            toast.success(t('common.saved'));
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const [selectedPlan, setSelectedPlan] = useState<PlanFeatures | null>(null);

    const currentPlan = userData?.subscription?.plan || 'free';

    const notifications = userData?.settings?.notifications || { daily: true, weekly: true, goals: true };

    return (
        <div className="max-w-2xl mx-auto pb-24 lg:pb-0">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">{t('settings.title')}</h1>

            <div className="space-y-6">
                {/* Profile - Deep Blue Theme */}
                <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-100">{t('settings.profile')}</h2>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Imię i nazwisko"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        // Assuming Input component handles styling, if not we might need to adjust props or component
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Email
                            </label>
                            <div className="px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400">
                                {user?.email}
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveProfile}
                            loading={savingProfile}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            {t('common.save')}
                        </Button>
                    </div>
                </div>

                {/* Preferences */}
                <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Palette className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-100">{t('settings.preferences')}</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Dark Mode */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-200">{t('settings.darkMode')}</span>
                            </div>
                            <button
                                onClick={() => updatePreference('darkMode', !userData?.settings?.darkMode)}
                                className={`w-12 h-6 rounded-full transition-colors ${userData?.settings?.darkMode ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${userData?.settings?.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* Language */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-200">{t('settings.language')}</span>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as any)}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm appearance-none cursor-pointer hover:border-emerald-500/50 transition-colors text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="pl">Polski 🇵🇱</option>
                                <option value="en">English 🇬🇧</option>
                            </select>
                        </div>

                        {/* Currency */}
                        <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-200">{t('settings.currency')}</span>
                            </div>
                            <select
                                value={userData?.settings?.currency || 'PLN'}
                                onChange={(e) => updatePreference('currency', e.target.value)}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm appearance-none cursor-pointer hover:border-emerald-500/50 transition-colors text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="PLN">PLN (zł)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Bell className="w-5 h-5 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-100">{t('settings.notifications')}</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { key: 'daily', label: 'Codzienne podsumowanie' },
                            { key: 'weekly', label: 'Raport tygodniowy' },
                            { key: 'goals', label: 'Postęp celów' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                                <span className="text-slate-200">{label}</span>
                                <button
                                    onClick={() => updatePreference('notifications', {
                                        ...notifications,
                                        [key]: !notifications[key as keyof typeof notifications]
                                    })}
                                    className={`w-12 h-6 rounded-full transition-colors ${notifications[key as keyof typeof notifications]
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications[key as keyof typeof notifications]
                                        ? 'translate-x-6'
                                        : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscription */}
                <div className="rounded-2xl bg-[#0F172A] border border-slate-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-100">{t('settings.subscription')}</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {SUBSCRIPTION_PLANS.map((plan) => {
                            const isCurrent = currentPlan === plan.id;
                            const PlanIcon = plan.id === 'free' ? Sparkles : plan.id === 'pro' ? Zap : Crown;
                            return (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`p-4 rounded-xl text-center transition-all ${isCurrent
                                        ? 'bg-emerald-500/10 border-2 border-emerald-500'
                                        : plan.isHighlighted
                                            ? 'bg-emerald-500/5 border-2 border-emerald-500/50 hover:border-emerald-500'
                                            : 'bg-slate-900/50 border border-slate-700 hover:border-emerald-500/50 cursor-pointer hover:bg-slate-800'
                                        }`}
                                >
                                    <PlanIcon className={`w-5 h-5 mx-auto mb-2 ${isCurrent ? 'text-emerald-400' : plan.isHighlighted ? 'text-emerald-400' : 'text-slate-400'}`} />
                                    <p className="font-semibold mb-1 text-slate-200">{plan.name}</p>
                                    <p className="text-sm text-slate-400">{plan.price} zł</p>
                                    {isCurrent && (
                                        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400 font-medium">
                                            <Check className="w-3 h-3" /> Aktywny
                                        </div>
                                    )}
                                    {plan.isHighlighted && !isCurrent && (
                                        <div className="mt-2 text-xs text-emerald-400 font-medium">
                                            {plan.highlightBadge}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Plan Preview Modal */}
                    <AnimatePresence>
                        {selectedPlan && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                                    onClick={() => setSelectedPlan(null)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6"
                                >
                                    <button
                                        onClick={() => setSelectedPlan(null)}
                                        className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="text-center mb-6">
                                        <div className={`w-16 h-16 rounded-2xl ${selectedPlan.isHighlighted ? 'bg-emerald-500/20' : 'bg-slate-800'} flex items-center justify-center mx-auto mb-4`}>
                                            {selectedPlan.id === 'free' ? <Sparkles className="w-8 h-8 text-slate-400" /> :
                                                selectedPlan.id === 'pro' ? <Zap className="w-8 h-8 text-blue-400" /> :
                                                    <Crown className="w-8 h-8 text-emerald-400" />}
                                        </div>
                                        <h3 className="text-2xl font-bold">{selectedPlan.name}</h3>
                                        <p className="text-slate-400">{selectedPlan.subtitle}</p>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">{selectedPlan.price}</span>
                                            <span className="text-slate-400"> zł/mies</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {selectedPlan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <Check className={`w-5 h-5 flex-shrink-0 ${selectedPlan.isHighlighted ? 'text-emerald-400' : 'text-slate-500'}`} />
                                                <span className="text-slate-200">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {currentPlan === selectedPlan.id ? (
                                        <div className="text-center py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                                            <span className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                                                <Check className="w-5 h-5" /> Aktualny plan
                                            </span>
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            onClick={async () => {
                                                if (!userData?.id) return;
                                                const toastId = toast.loading('Aktualizacja...');
                                                try {
                                                    const result = await subscriptionService.upgradeSubscription(
                                                        userData.id,
                                                        selectedPlan.id
                                                    );
                                                    if (result.success) {
                                                        toast.success('Plan zaktualizowany!', { id: toastId });
                                                        setSelectedPlan(null);
                                                        window.location.reload();
                                                    } else {
                                                        toast.error(result.error || 'Błąd', { id: toastId });
                                                    }
                                                } catch (e) {
                                                    toast.error('Błąd połączenia', { id: toastId });
                                                }
                                            }}
                                        >
                                            {selectedPlan.price === 0 ? 'Przejdź na Free' : `Wybierz ${selectedPlan.name}`}
                                        </Button>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sign Out */}
                <Button
                    variant="outline"
                    className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                    onClick={handleSignOut}
                    icon={<LogOut className="w-5 h-5" />}
                >
                    {t('common.delete')} / Wyloguj
                </Button>
            </div>
        </div>
    );
}
