'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Upload,
    Target,
    Flame,
    ArrowRight,
    Check,
    Sparkles,
    Rocket
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface OnboardingWizardProps {
    onComplete: () => void;
}

const STEPS = [
    {
        id: 1,
        title: 'Dodaj pierwszy wydatek',
        subtitle: 'Zeskanuj paragon lub zaimportuj z banku',
        emoji: '📸',
        options: [
            { id: 'scan', label: 'Zeskanuj paragon', icon: Camera, href: '/scan', color: 'emerald' },
            { id: 'import', label: 'Importuj z banku', icon: Upload, href: '/import', color: 'blue' },
        ]
    },
    {
        id: 2,
        title: 'Ustaw pierwszy cel',
        subtitle: 'Na co chcesz oszczędzać?',
        emoji: '🎯',
        quickGoals: [
            { name: 'Wakacje', emoji: '✈️', amount: 500000 },
            { name: 'iPhone', emoji: '📱', amount: 499900 },
            { name: 'Samochód', emoji: '🚗', amount: 2000000 },
            { name: 'Fundusz awaryjny', emoji: '🛡️', amount: 1000000 },
        ]
    },
    {
        id: 3,
        title: 'Wybierz wyzwanie',
        subtitle: 'Zacznij od czegoś prostego',
        emoji: '🔥',
        challenges: [
            { id: 'home_barista', name: 'Domowy Barista', emoji: '☕', desc: 'Zrób kawę w domu 5 razy', points: 150 },
            { id: 'scan_master', name: 'Skanoholik', emoji: '📸', desc: 'Zeskanuj 5 paragonów', points: 120 },
            { id: 'streak_7', name: 'Tygodniowy Wojownik', emoji: '🔥', desc: '7-dniowy streak', points: 100 },
        ]
    }
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const { userData } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Record<number, string>>({});
    const [completing, setCompleting] = useState(false);

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const handleSelection = (stepId: number, selectionId: string) => {
        setSelections(prev => ({ ...prev, [stepId]: selectionId }));
    };

    const handleNext = async () => {
        if (isLastStep) {
            setCompleting(true);
            // Mark onboarding complete
            if (userData?.id) {
                await updateDoc(doc(db, 'users', userData.id), {
                    onboardingComplete: true,
                });
            }
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleSkip = async () => {
        if (userData?.id) {
            await updateDoc(doc(db, 'users', userData.id), {
                onboardingComplete: true,
            });
        }
        onComplete();
    };

    const handleActionClick = (href: string) => {
        // Save that they started, then redirect
        handleSelection(step.id, href);
        router.push(href);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg"
            >
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Krok {currentStep + 1} z {STEPS.length}</span>
                        <button onClick={handleSkip} className="hover:text-white transition-colors">
                            Pomiń
                        </button>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                        />
                    </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="p-8 text-center">
                            {/* Emoji */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.1 }}
                                className="text-6xl mb-4"
                            >
                                {step.emoji}
                            </motion.div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                            <p className="text-slate-400 mb-6">{step.subtitle}</p>

                            {/* Step 1: Action buttons */}
                            {step.id === 1 && step.options && (
                                <div className="space-y-3">
                                    {step.options.map((option) => (
                                        <motion.button
                                            key={option.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleActionClick(option.href)}
                                            className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${option.color === 'emerald'
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                                    : 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${option.color === 'emerald' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                                                }`}>
                                                <option.icon className={`w-6 h-6 ${option.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                                                    }`} />
                                            </div>
                                            <span className="font-medium">{option.label}</span>
                                            <ArrowRight className="w-5 h-5 ml-auto text-slate-400" />
                                        </motion.button>
                                    ))}

                                    <button
                                        onClick={handleNext}
                                        className="text-sm text-slate-500 hover:text-slate-300 mt-4"
                                    >
                                        Zrobię to później →
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Quick goals */}
                            {step.id === 2 && step.quickGoals && (
                                <div className="grid grid-cols-2 gap-3">
                                    {step.quickGoals.map((goal) => (
                                        <motion.button
                                            key={goal.name}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                handleSelection(step.id, goal.name);
                                                // In real implementation, would create goal in Firestore
                                                setTimeout(handleNext, 300);
                                            }}
                                            className={`p-4 rounded-xl border transition-all ${selections[step.id] === goal.name
                                                    ? 'border-emerald-500 bg-emerald-500/20'
                                                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                                }`}
                                        >
                                            <span className="text-3xl block mb-2">{goal.emoji}</span>
                                            <span className="font-medium block">{goal.name}</span>
                                            <span className="text-sm text-slate-400">
                                                {(goal.amount / 100).toLocaleString()} zł
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Step 3: Challenges */}
                            {step.id === 3 && step.challenges && (
                                <div className="space-y-3">
                                    {step.challenges.map((challenge) => (
                                        <motion.button
                                            key={challenge.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                handleSelection(step.id, challenge.id);
                                            }}
                                            className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${selections[step.id] === challenge.id
                                                    ? 'border-emerald-500 bg-emerald-500/20'
                                                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                                }`}
                                        >
                                            <span className="text-2xl">{challenge.emoji}</span>
                                            <div className="text-left flex-1">
                                                <p className="font-medium">{challenge.name}</p>
                                                <p className="text-sm text-slate-400">{challenge.desc}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-amber-400 font-medium">+{challenge.points}</span>
                                                <p className="text-xs text-slate-500">punktów</p>
                                            </div>
                                            {selections[step.id] === challenge.id && (
                                                <Check className="w-5 h-5 text-emerald-400" />
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {/* Next/Complete Button */}
                            {(step.id === 3 || (step.id === 2 && selections[step.id])) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6"
                                >
                                    <Button
                                        onClick={handleNext}
                                        disabled={completing}
                                        className="w-full"
                                    >
                                        {completing ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Sparkles className="w-5 h-5" />
                                            </motion.div>
                                        ) : isLastStep ? (
                                            <>
                                                <Rocket className="w-5 h-5 mr-2" />
                                                Zaczynamy!
                                            </>
                                        ) : (
                                            <>
                                                Dalej
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </Card>
                    </motion.div>
                </AnimatePresence>

                {/* Step Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${i === currentStep
                                    ? 'w-6 bg-emerald-500'
                                    : i < currentStep
                                        ? 'bg-emerald-500/50'
                                        : 'bg-slate-700'
                                }`}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
