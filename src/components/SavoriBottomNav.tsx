'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, PieChart, Shield, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHaptic } from '@/hooks/use-haptic';
import dynamic from 'next/dynamic';

// Lazy load the voice modal
const VoiceExpenseModal = dynamic(() => import('@/components/voice/VoiceExpenseModal'), {
    ssr: false,
});

export default function SavoriBottomNav() {
    const pathname = usePathname();
    const { trigger } = useHaptic();
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    const isActive = (path: string) => pathname === path;

    const handleNavClick = () => {
        trigger('soft');
    };

    const handleVoiceClick = () => {
        trigger('medium');
        setShowVoiceModal(true);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
                {/* Gradient Fade */}
                <div className="bg-gradient-to-t from-[#0B0E14] to-transparent h-24 w-full absolute bottom-0"></div>

                <div className="flex justify-center pb-6 pt-2 px-4 max-w-md mx-auto relative pointer-events-auto">
                    <nav className="bg-[#161b22]/90 backdrop-blur-md border border-white/10 rounded-3xl p-1.5 flex justify-between items-center w-full shadow-2xl">

                        {/* Voice Add - NEW! */}
                        <button
                            onClick={handleVoiceClick}
                            className="flex flex-col items-center justify-center w-full h-14 rounded-2xl hover:bg-white/5 text-slate-400 hover:text-white transition group relative"
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="relative"
                            >
                                <Mic className="w-6 h-6 mb-0.5 group-hover:text-emerald-400 transition-colors" />
                                {/* Pulse indicator */}
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            </motion.div>
                            <span className="text-[10px] font-medium">Głos</span>
                        </button>

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

                        {/* Dashboard / Home */}
                        <Link
                            href="/dashboard"
                            onClick={handleNavClick}
                            className={`flex flex-col items-center justify-center w-full h-14 rounded-2xl ml-1 transition-all ${isActive('/dashboard')
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                }`}
                        >
                            <Home className="w-6 h-6 mb-0.5" />
                            <span className="text-[10px] font-bold">Pulpit</span>
                        </Link>

                    </nav>
                </div>
            </div>

            {/* Voice Modal */}
            <VoiceExpenseModal
                isOpen={showVoiceModal}
                onClose={() => setShowVoiceModal(false)}
            />
        </>
    );
}
