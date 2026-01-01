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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { subscriptionService } from '@/lib/subscription-service';
import { formatMoney } from '@/lib/utils';

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

    const plans = [
        { id: 'free', name: 'Free', price: '0', current: userData?.subscription?.plan === 'free' },
        { id: 'pro', name: 'Pro', price: '19.99', current: userData?.subscription?.plan === 'pro' },
        { id: 'premium', name: 'Premium', price: '39.99', current: userData?.subscription?.plan === 'premium' },
    ];

    const notifications = userData?.settings?.notifications || { daily: true, weekly: true, goals: true };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('settings.title')}</h1>

            <div className="space-y-6">
                {/* Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            {t('settings.profile')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Imię i nazwisko"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <p className="text-slate-400">{user?.email}</p>
                        </div>
                        <Button
                            onClick={handleSaveProfile}
                            loading={savingProfile}
                            className="w-full"
                        >
                            {t('common.save')}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-blue-400" />
                            {t('settings.preferences')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Dark Mode */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-slate-400" />
                                <span>{t('settings.darkMode')}</span>
                            </div>
                            <button
                                onClick={() => updatePreference('darkMode', !userData?.settings?.darkMode)}
                                className={`w-12 h-6 rounded-full transition-colors ${userData?.settings?.darkMode ? 'bg-emerald-500' : 'bg-slate-600'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${userData?.settings?.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>

                        {/* Language */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-slate-400" />
                                <span>{t('settings.language')}</span>
                            </div>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as any)}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm appearance-none cursor-pointer hover:border-slate-500 transition-colors"
                            >
                                <option value="pl">Polski 🇵🇱</option>
                                <option value="en">English 🇬🇧</option>
                            </select>
                        </div>

                        {/* Currency */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 text-slate-400" />
                                <span>{t('settings.currency')}</span>
                            </div>
                            <select
                                value={userData?.settings?.currency || 'PLN'}
                                onChange={(e) => updatePreference('currency', e.target.value)}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm appearance-none cursor-pointer hover:border-slate-500 transition-colors"
                            >
                                <option value="PLN">PLN (zł)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-400" />
                            {t('settings.notifications')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { key: 'daily', label: 'Codzienne podsumowanie' },
                            { key: 'weekly', label: 'Raport tygodniowy' },
                            { key: 'goals', label: 'Postęp celów' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                                <span>{label}</span>
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
                    </CardContent>
                </Card>

                {/* Subscription */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-purple-400" />
                            {t('settings.subscription')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={async () => {
                                        if (plan.current || !userData?.id) return;
                                        const toastId = toast.loading('Working...');
                                        try {
                                            const result = await subscriptionService.upgradeSubscription(
                                                userData.id,
                                                plan.id as 'free' | 'pro' | 'premium'
                                            );
                                            if (result.success) {
                                                toast.success('Plan updated!', { id: toastId });
                                            } else {
                                                toast.error(result.error || 'Error', { id: toastId });
                                            }
                                        } catch (e) {
                                            toast.error('Error', { id: toastId });
                                        }
                                    }}
                                    className={`p-4 rounded-xl text-center transition-all ${plan.current
                                        ? 'bg-emerald-500/10 border-2 border-emerald-500'
                                        : 'bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 cursor-pointer'
                                        }`}
                                >
                                    <p className="font-semibold mb-1">{plan.name}</p>
                                    <p className="text-sm text-slate-400">{plan.price} zł</p>
                                    {plan.current && (
                                        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <Button
                    variant="outline"
                    className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                    onClick={handleSignOut}
                    icon={<LogOut className="w-5 h-5" />}
                >
                    {t('common.delete')} / Wyloguj
                </Button>
            </div>
        </div>
    );
}
