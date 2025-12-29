'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    User,
    Bell,
    Palette,
    Shield,
    CreditCard,
    LogOut,
    ChevronRight,
    Moon,
    Sun,
    Globe,
    Coins,
    Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const { user, userData, signOut, updateUserData } = useAuth();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        displayName: userData?.displayName || '',
        currency: userData?.settings?.currency || 'PLN',
        language: userData?.settings?.language || 'pl',
        darkMode: userData?.settings?.darkMode ?? true,
        notifications: userData?.settings?.notifications || {
            daily: true,
            weekly: true,
            goals: true,
        },
    });

    const handleSave = async () => {
        if (!user) return;

        try {
            setSaving(true);
            await updateUserData({
                displayName: settings.displayName,
                settings: {
                    currency: settings.currency as 'PLN' | 'EUR' | 'USD',
                    language: settings.language as 'pl' | 'en',
                    darkMode: settings.darkMode,
                    notifications: settings.notifications,
                },
            });
            toast.success('Ustawienia zapisane');
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się zapisać ustawień');
        } finally {
            setSaving(false);
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

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Ustawienia</h1>

            <div className="space-y-6">
                {/* Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-400" />
                            Profil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            label="Imię i nazwisko"
                            value={settings.displayName}
                            onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <p className="text-slate-400">{user?.email}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-blue-400" />
                            Preferencje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-slate-400" />
                                <span>Tryb ciemny</span>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                                className={`w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-emerald-500' : 'bg-slate-600'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-slate-400" />
                                <span>Język</span>
                            </div>
                            <select
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value as 'pl' | 'en' })}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                            >
                                <option value="pl">Polski</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Coins className="w-5 h-5 text-slate-400" />
                                <span>Waluta</span>
                            </div>
                            <select
                                value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value as 'PLN' | 'EUR' | 'USD' })}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm"
                            >
                                <option value="PLN">PLN</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-amber-400" />
                            Powiadomienia
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
                                    onClick={() => setSettings({
                                        ...settings,
                                        notifications: {
                                            ...settings.notifications,
                                            [key]: !settings.notifications[key as keyof typeof settings.notifications],
                                        },
                                    })}
                                    className={`w-12 h-6 rounded-full transition-colors ${settings.notifications[key as keyof typeof settings.notifications]
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-600'
                                        }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.notifications[key as keyof typeof settings.notifications]
                                            ? 'translate-x-6'
                                            : 'translate-x-0.5'
                                            }`}
                                    />
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
                            Subskrypcja
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            {plans.map((plan) => (
                                <button
                                    key={plan.id}
                                    className={`p-4 rounded-xl text-center transition-all ${plan.current
                                        ? 'bg-emerald-500/10 border-2 border-emerald-500'
                                        : 'bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50'
                                        }`}
                                    disabled={plan.current}
                                >
                                    <p className="font-semibold mb-1">{plan.name}</p>
                                    <p className="text-sm text-slate-400">
                                        {plan.price} zł/msc
                                    </p>
                                    {plan.current && (
                                        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-400">
                                            <Check className="w-3 h-3" />
                                            Aktywny
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">
                            Płatności obsługiwane przez Stripe (wkrótce)
                        </p>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Button onClick={handleSave} loading={saving} className="w-full">
                        Zapisz zmiany
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={handleSignOut}
                        icon={<LogOut className="w-5 h-5" />}
                    >
                        Wyloguj się
                    </Button>
                </div>
            </div>
        </div>
    );
}
