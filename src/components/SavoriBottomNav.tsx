'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, PieChart, Shield, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/hooks/use-haptic';

export default function SavoriBottomNav() {
    const pathname = usePathname();
    const { trigger } = useHaptic();

    const isActive = (path: string) => pathname === path;

    const handleNavClick = () => {
        trigger('soft');
    };

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
            {/* Gradient Fade */}
            <div className="bg-gradient-to-t from-[#0B0E14] to-transparent h-24 w-full absolute bottom-0"></div>

            <div className="flex justify-center pb-6 pt-2 px-4 max-w-md mx-auto relative pointer-events-auto">
                <nav className="bg-[#161b22]/90 backdrop-blur-md border border-white/10 rounded-3xl p-1.5 flex justify-between items-center w-full shadow-2xl">

                    {/* Dashboard / Scan */}
                    <Link
                        href="/dashboard"
                        onClick={handleNavClick}
                        className="flex flex-col items-center justify-center w-full h-14 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition group"
                    >
                        <ScanLine className={`w-6 h-6 mb-0.5 transition-colors ${isActive('/dashboard') ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
                        <span className="text-[10px] font-medium">Skanuj</span>
                    </Link>

                    {/* Budget */}
                    <Link
                        href="/budgets"
                        onClick={handleNavClick}
                        className={`flex flex-col items-center justify-center w-full h-14 rounded-2xl transition group ${isActive('/budgets') ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        {isActive('/budgets') && (
                            <motion.span
                                layoutId="nav-dot"
                                className="absolute top-2 right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                            />
                        )}
                        <PieChart className={`w-6 h-6 mb-0.5 ${isActive('/budgets') ? 'text-emerald-400' : ''}`} />
                        <span className="text-[10px] font-medium">Budżet</span>
                    </Link>

                    {/* Transactions */}
                    <Link
                        href="/expenses"
                        onClick={handleNavClick}
                        className="flex flex-col items-center justify-center w-full h-14 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition group"
                    >
                        <Shield className={`w-6 h-6 mb-0.5 ${isActive('/expenses') ? 'text-orange-400' : ''}`} />
                        <span className="text-[10px] font-medium">Transakcje</span>
                    </Link>

                    {/* Menu / Sidebar */}
                    <Link
                        href="/settings"
                        onClick={handleNavClick}
                        className="flex flex-col items-center justify-center w-full h-14 rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/20 ml-1 active:scale-95 transition-transform"
                    >
                        <Menu className="w-6 h-6 mb-0.5" />
                        <span className="text-[10px] font-bold">Menu</span>
                    </Link>

                </nav>
            </div>
        </div>
    );
}
