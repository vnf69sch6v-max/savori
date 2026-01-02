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
                            label={t('settings.profileName')}
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
                            { key: 'daily', label: t('settings.dailySummary') },
                            { key: 'weekly', label: t('settings.weeklyReport') },
                            { key: 'goals', label: t('settings.goalProgress') },
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

                    <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentPlan === 'free' ? 'bg-slate-700/50 text-slate-400' :
                                    currentPlan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-purple-500/20 text-purple-400'
                                }`}>
                                {currentPlan === 'free' ? <Sparkles className="w-6 h-6" /> :
                                    currentPlan === 'pro' ? <Zap className="w-6 h-6" /> :
                                        <Crown className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="font-semibold text-white capitalize">{currentPlan} Plan</h3>
                                <p className="text-sm text-slate-400">
                                    {currentPlan === 'free' ? t('subscription.free.description') :
                                        currentPlan === 'pro' ? t('subscription.pro.description') :
                                            t('subscription.ultra.description')}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/settings/billing')}
                            variant={currentPlan === 'free' ? 'primary' : 'outline'}
                        >
                            {currentPlan === 'free' ? t('subscription.upgrade') : t('subscription.manage')}
                        </Button>
                    </div>
                </div>

                {/* Sign Out */}
                <Button
                    variant="outline"
                    className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                    onClick={handleSignOut}
                    icon={<LogOut className="w-5 h-5" />}
                >
                    {t('common.signOut')}
                </Button>
            </div>
        </div>
    );
}
