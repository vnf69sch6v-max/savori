'use client';

import { Search, Bell, Menu, PiggyBank } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import OmniSearch from '@/components/OmniSearch';
import NotificationCenter from '@/components/NotificationCenter';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/hooks/use-language';

export default function DashboardHeader() {
    const { openSidebar } = useUIStore();
    const { t } = useLanguage();

    return (
        <header className="px-6 flex justify-between items-center mb-6 pt-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <PiggyBank className="w-6 h-6" />
                </div>
                <h1 className="font-bold text-2xl text-white tracking-wide">Savori</h1>
            </div>
            <div className="flex gap-3 items-center">
                <LanguageSwitcher />

                <div className="w-10 h-10 flex items-center justify-center">
                    <OmniSearch />
                </div>

                <div className="w-10 h-10 flex items-center justify-center">
                    <NotificationCenter />
                </div>

                <button
                    onClick={openSidebar}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 transition"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
