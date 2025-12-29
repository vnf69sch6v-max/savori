'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    Camera,
    Target,
    BarChart3,
    Settings,
    LogOut,
    PiggyBank,
    Menu,
    X,
    Shield,
    Wallet,
    Trophy,
    Flame,
    FileText,
    ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import OnboardingWizard from '@/components/OnboardingWizard';
import MobileBottomNav from '@/components/MobileBottomNav';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/expenses', icon: Receipt, label: 'Wydatki' },
    { href: '/budgets', icon: Wallet, label: 'Budżety' },
    { href: '/scan', icon: Camera, label: 'Skanuj' },
    { href: '/import', icon: FileText, label: 'Import' },
    { href: '/goals', icon: Target, label: 'Cele' },
    { href: '/challenges', icon: Flame, label: 'Wyzwania' },
    { href: '/shop', icon: ShoppingBag, label: 'Sklep' },
    { href: '/achievements', icon: Trophy, label: 'Osiągnięcia' },
    { href: '/analytics', icon: BarChart3, label: 'Analityka' },
    { href: '/reports', icon: FileText, label: 'Raporty' },
    { href: '/security', icon: Shield, label: 'Bezpieczeństwo' },
    { href: '/settings', icon: Settings, label: 'Ustawienia' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userData, loading, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(true);

    // Redirect to login if not authenticated
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

    // Show onboarding for new users
    const shouldShowOnboarding = showOnboarding && userData && !userData.onboardingComplete;

    return (
        <div className="min-h-screen flex">
            {/* Onboarding Wizard */}
            {shouldShowOnboarding && (
                <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
            )}
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-slate-900/50 border-r border-slate-800">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 p-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <PiggyBank className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl">Savori</span>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                        {item.href === '/scan' && (
                                            <span className="ml-auto px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                                                AI
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Section */}
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
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-50 flex items-center justify-between px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Savori</span>
                </Link>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:hidden fixed inset-0 z-40 bg-slate-900/95 backdrop-blur pt-16"
                >
                    <nav className="p-4">
                        <ul className="space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
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
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 w-full px-4 py-3 mt-4 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Wyloguj się
                        </button>
                    </nav>
                </motion.div>
            )}

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
                <div className="p-4 lg:p-8">{children}</div>
            </main>
        </div>
    );
}
