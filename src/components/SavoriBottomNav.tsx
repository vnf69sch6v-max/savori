'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, PieChart, Receipt, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '@/hooks/use-haptic';
import dynamic from 'next/dynamic';

// Lazy load the voice modal
const VoiceExpenseModal = dynamic(() => import('@/components/voice/VoiceExpenseModal'), {
    ssr: false,
});

interface NavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    accentColor?: string;
}

function NavItem({ href, icon: Icon, label, isActive, onClick, accentColor = 'emerald' }: NavItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="relative flex flex-col items-center justify-center flex-1 py-2 group"
        >
            {/* Active indicator - subtle pill behind icon */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        layoutId="activeTab"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={`absolute top-1 w-10 h-10 rounded-2xl bg-${accentColor}-500/15`}
                    />
                )}
            </AnimatePresence>

            {/* Icon */}
            <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative z-10"
            >
                <Icon
                    className={`w-6 h-6 transition-colors duration-200 ${isActive
                        ? `text-${accentColor}-400`
                        : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                    fill={isActive ? 'currentColor' : 'none'}
                    strokeWidth={isActive ? 1.5 : 2}
                />
            </motion.div>

            {/* Label */}
            <span
                className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${isActive
                    ? `text-${accentColor}-400`
                    : 'text-slate-500 group-hover:text-slate-300'
                    }`}
            >
                {label}
            </span>
        </Link>
    );
}

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
                {/* Gradient Fade - more subtle */}
                <div className="bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent h-20 w-full absolute bottom-0" />

                <div className="flex justify-center pb-6 pt-2 px-4 max-w-md mx-auto relative pointer-events-auto">
                    {/* Frosted glass container */}
                    <nav className="bg-[#1a1f26]/80 backdrop-blur-xl border border-white/[0.08] rounded-[22px] px-2 py-1 flex items-center w-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

                        {/* Voice Add */}
                        <button
                            onClick={handleVoiceClick}
                            className="relative flex flex-col items-center justify-center flex-1 py-2 group"
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="relative"
                            >
                                <Mic className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors duration-200" />
                                {/* Live indicator */}
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full">
                                    <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                                </span>
                            </motion.div>
                            <span className="text-[10px] mt-1 font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
                                Voice
                            </span>
                        </button>

                        {/* Budget */}
                        <NavItem
                            href="/budgets"
                            icon={PieChart}
                            label="Budget"
                            isActive={isActive('/budgets')}
                            onClick={handleNavClick}
                            accentColor="emerald"
                        />

                        {/* Transactions */}
                        <NavItem
                            href="/expenses"
                            icon={Receipt}
                            label="Transactions"
                            isActive={isActive('/expenses')}
                            onClick={handleNavClick}
                            accentColor="emerald"
                        />

                        {/* Dashboard / Home - primary action */}
                        <div className="relative flex flex-col items-center justify-center flex-1 py-1">
                            <Link
                                href="/dashboard"
                                onClick={handleNavClick}
                                className="relative"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive('/dashboard')
                                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                                        : 'bg-violet-500/90 shadow-lg shadow-violet-500/20'
                                        }`}
                                >
                                    <Home className="w-6 h-6 text-white" strokeWidth={2} />
                                    <span className="text-[9px] font-semibold text-white/90 mt-0.5">
                                        Home
                                    </span>
                                </motion.div>
                            </Link>
                        </div>

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

