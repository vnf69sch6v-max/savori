'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    CreditCard,
    Receipt,
    Wallet,
    BarChart3,
    Trophy,
    User,
    LogOut,
    Menu,
    X,
    Settings,
    Bell,
    Sparkles,
    Target,
    Flame,
    Users,
    ShoppingBag,
    Shield,
    Camera,
    Download,
    PiggyBank
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingWizard from '@/components/OnboardingWizard';
import SavoriBottomNav from '@/components/SavoriBottomNav';
import NotificationCenter from '@/components/NotificationCenter';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUIStore } from '@/stores/uiStore';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PageTransition from '@/components/PageTransition';

// Grouped navigation structure
const navGroups = [
    {
        label: null,
        items: [
            { href: '/dashboard', icon: LayoutDashboard, label: 'Pulpit' },
        ]
    },
    {
        label: 'Finanse',
        items: [
            { href: '/expenses', icon: Receipt, label: 'Wydatki' },
            { href: '/subscriptions', icon: CreditCard, label: 'Subskrypcje' },
            { href: '/budgets', icon: Wallet, label: 'Budżety' },
            { href: '/analytics', icon: BarChart3, label: 'Analityka' },
        ]
    },
    {
        label: 'Cele & Rozwój',
        items: [
            { href: '/goals', icon: Target, label: 'Cele' },
            { href: '/challenges', icon: Flame, label: 'Wyzwania' },
            { href: '/achievements', icon: Trophy, label: 'Osiągnięcia' },
        ]
    },
    {
        label: 'Social',
        items: [
            { href: '/social', icon: Users, label: 'Znajomi' },
            { href: '/leaderboard', icon: Trophy, label: 'Ranking' },
            { href: '/shop', icon: ShoppingBag, label: 'Sklep' },
        ]
    },
    {
        label: 'System',
        items: [
            { href: '/settings', icon: Settings, label: 'Ustawienia' },
            { href: '/security', icon: Shield, label: 'Bezpieczeństwo' },
        ]
    },
];

const quickActions = [
    { href: '/scan', icon: Camera, label: 'Skanuj', badge: 'AI' },
    { href: '/import', icon: Download, label: 'Import' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userData, loading, signOut } = useAuth();
    const { isSidebarOpen, closeSidebar } = useUIStore();
    const [showOnboarding, setShowOnboarding] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    const shouldShowOnboarding = showOnboarding && userData && !userData.onboardingComplete;

    return (
        <div className="min-h-screen flex overflow-x-hidden w-full bg-[#0B0E14] text-white">
            {shouldShowOnboarding && (
                <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
            )}

            <PWAInstallPrompt />

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-slate-900/50 border-r border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-2 p-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl">Savori</span>
                </Link>

                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <div className="flex gap-2 mb-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all"
                            >
                                <action.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{action.label}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {navGroups.map((group, groupIndex) => (
                            <div key={groupIndex}>
                                {group.label && (
                                    <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        {group.label}
                                    </p>
                                )}
                                <ul className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="font-medium text-sm">{item.label}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-medium">
                            {userData?.displayName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{userData?.displayName}</p>
                            <p className="text-xs text-slate-400 truncate">
                                {userData?.subscription?.plan === 'free' ? 'Plan Free' : `Plan ${userData?.subscription?.plan}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Wyloguj się
                    </button>
                    <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-center">
                        <LanguageSwitcher />
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:hidden fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur pt-16 overflow-y-auto"
                >
                    <button
                        onClick={closeSidebar}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <nav className="p-4">
                        <div className="flex gap-2 mb-4">
                            {quickActions.map((action) => (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    onClick={closeSidebar}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400"
                                >
                                    <action.icon className="w-5 h-5" />
                                    <span className="font-medium">{action.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {navGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                    {group.label && (
                                        <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            {group.label}
                                        </p>
                                    )}
                                    <ul className="space-y-1">
                                        {group.items.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <li key={item.href}>
                                                    <Link
                                                        href={item.href}
                                                        onClick={closeSidebar}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                            ? 'bg-emerald-500/10 text-emerald-400'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <item.icon className="w-5 h-5" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 w-full px-4 py-3 mt-4 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Wyloguj się
                        </button>

                        <div className="mt-6 pt-6 border-t border-slate-800/50 flex justify-center">
                            <LanguageSwitcher />
                        </div>
                    </nav>
                </motion.div>
            )}

            {/* Mobile Bottom Navigation (Floating Glass) */}
            <div className="lg:hidden">
                <SavoriBottomNav />
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 pt-0 lg:pt-0 pb-20 lg:pb-0">
                <ErrorBoundary>
                    <PageTransition>
                        <div className="p-4 lg:p-8">{children}</div>
                    </PageTransition>
                </ErrorBoundary>
            </main>
        </div>
    );
}


