'use client';

/**
 * UpgradeSuccessModal
 * Beautiful full-screen celebration after upgrading to Pro/Ultra
 * Shows what features are now unlocked with Apple-style animations
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Crown,
    Check,
    ChevronRight,
    Brain,
    BarChart3,
    TrendingUp,
    Clock,
    Scan,
    MessageSquare,
    Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface UnlockedFeature {
    icon: React.ElementType;
    name: string;
    description: string;
}

const PRO_FEATURES: UnlockedFeature[] = [
    { icon: Brain, name: 'AI Insights', description: 'Personalizowane porady finansowe' },
    { icon: BarChart3, name: 'Anonimowe Benchmarki', description: 'Porównaj się z innymi' },
    { icon: TrendingUp, name: 'Money Wrapped', description: 'Podsumowania w stylu Spotify' },
    { icon: Clock, name: 'Pre-Purchase Pause', description: '24h pauza na przemyślenie' },
    { icon: Scan, name: '30 skanów/mies', description: 'OCR paragonów z AI' },
    { icon: MessageSquare, name: '50 wiadomości AI', description: 'Czat z asystentem' },
];

const ULTRA_FEATURES: UnlockedFeature[] = [
    ...PRO_FEATURES.slice(0, 4),
    { icon: Scan, name: 'Nielimitowane skany', description: 'Skanuj bez ograniczeń' },
    { icon: MessageSquare, name: 'Nielimitowany AI', description: 'Bez limitu wiadomości' },
    { icon: Target, name: 'Priorytetowe wsparcie', description: 'Dedykowana pomoc' },
];

interface UpgradeSuccessModalProps {
    isOpen: boolean;
    plan: 'pro' | 'ultra';
    onComplete: () => void;
}

export default function UpgradeSuccessModal({ isOpen, plan, onComplete }: UpgradeSuccessModalProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const features = plan === 'ultra' ? ULTRA_FEATURES : PRO_FEATURES;
    const planLabel = plan === 'pro' ? 'Pro' : 'Ultra';
    const planColor = plan === 'pro' ? 'emerald' : 'purple';

    // Trigger confetti on open
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);

            // Confetti burst
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.8 },
                    colors: plan === 'pro'
                        ? ['#10b981', '#34d399', '#6ee7b7']
                        : ['#a855f7', '#c084fc', '#d8b4fe'],
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.8 },
                    colors: plan === 'pro'
                        ? ['#10b981', '#34d399', '#6ee7b7']
                        : ['#a855f7', '#c084fc', '#d8b4fe'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();

            // Auto-advance steps
            const timer = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= features.length) {
                        clearInterval(timer);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 400);

            return () => clearInterval(timer);
        }
    }, [isOpen, plan, features.length]);

    const handleContinue = () => {
        onComplete();
        router.push('/dashboard');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] bg-slate-950 flex flex-col"
                >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${plan === 'pro'
                        ? 'from-emerald-600/20 via-transparent to-transparent'
                        : 'from-purple-600/20 via-transparent to-transparent'
                        }`} />

                    {/* Content - scrollable with safe area */}
                    <div className="relative flex-1 flex flex-col items-center px-6 pt-16 pb-8 overflow-y-auto safe-area-inset"
                        style={{ paddingTop: 'max(4rem, env(safe-area-inset-top))' }}>
                        {/* Celebration icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 ${plan === 'pro'
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30'
                                : 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/30'
                                }`}
                        >
                            {plan === 'pro' ? (
                                <Sparkles className="w-12 h-12 text-white" />
                            ) : (
                                <Crown className="w-12 h-12 text-white" />
                            )}
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl md:text-4xl font-bold text-white text-center mb-2"
                        >
                            Witaj w {planLabel}! 🎉
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-slate-400 text-center mb-10 max-w-md"
                        >
                            Twój plan został aktywowany. Oto co zostało odblokowane:
                        </motion.p>

                        {/* Unlocked features list */}
                        <div className="w-full max-w-md space-y-3 mb-10">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.name}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{
                                        opacity: currentStep > index ? 1 : 0.3,
                                        x: currentStep > index ? 0 : -30,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.1 + 0.6,
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl ${currentStep > index
                                        ? `bg-${planColor}-500/10 border border-${planColor}-500/20`
                                        : 'bg-slate-800/30'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentStep > index
                                        ? `bg-${planColor}-500/20`
                                        : 'bg-slate-700/50'
                                        }`}>
                                        <feature.icon className={`w-5 h-5 ${currentStep > index
                                            ? `text-${planColor}-400`
                                            : 'text-slate-500'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{feature.name}</p>
                                        <p className="text-sm text-slate-400">{feature.description}</p>
                                    </div>
                                    <AnimatePresence>
                                        {currentStep > index && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className={`w-6 h-6 rounded-full bg-${planColor}-500 flex items-center justify-center`}
                                            >
                                                <Check className="w-4 h-4 text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>

                        {/* Continue button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{
                                opacity: currentStep >= features.length ? 1 : 0.5,
                                y: 0,
                            }}
                            transition={{ delay: features.length * 0.1 + 0.8 }}
                            onClick={handleContinue}
                            disabled={currentStep < features.length}
                            className={`w-full max-w-md py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${currentStep >= features.length
                                ? plan === 'pro'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 hover:shadow-xl'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:shadow-xl'
                                : 'bg-slate-700 cursor-not-allowed'
                                }`}
                        >
                            Przejdź do pulpitu
                            <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
