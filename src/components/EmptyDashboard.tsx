'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Camera,
    Upload,
    Target,
    Flame,
    ArrowRight,
    Check,
    FileText,
    Sparkles,
} from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    completed: boolean;
}

interface EmptyDashboardProps {
    userName: string;
    onStepsComplete?: () => void;
}

export default function EmptyDashboard({ userName }: EmptyDashboardProps) {
    const { userData } = useAuth();
    const [steps, setSteps] = useState<OnboardingStep[]>([
        { id: 1, title: 'Dodaj pierwszy wydatek', description: 'Zeskanuj paragon lub importuj z banku', icon: Camera, href: '/scan', completed: false },
        { id: 2, title: 'Ustaw cel oszczędnościowy', description: 'Na co chcesz oszczędzać?', icon: Target, href: '/goals', completed: false },
        { id: 3, title: 'Rozpocznij wyzwanie', description: 'Zmotywuj się do działania', icon: Flame, href: '/challenges', completed: false },
    ]);

    // Check completion status
    useEffect(() => {
        if (!userData?.id) return;

        const checkProgress = async () => {
            try {
                // Check expenses
                const expensesSnap = await getDocs(query(collection(db, 'users', userData.id, 'expenses'), limit(1)));
                const hasExpenses = !expensesSnap.empty;

                // Check goals
                const goalsSnap = await getDocs(query(collection(db, 'users', userData.id, 'goals'), limit(1)));
                const hasGoals = !goalsSnap.empty;

                // Check challenges
                const challengesSnap = await getDocs(query(collection(db, 'users', userData.id, 'activeChallenges'), limit(1)));
                const hasChallenges = !challengesSnap.empty;

                setSteps(prev => prev.map(step => ({
                    ...step,
                    completed:
                        step.id === 1 ? hasExpenses :
                            step.id === 2 ? hasGoals :
                                step.id === 3 ? hasChallenges : false
                })));
            } catch (error) {
                console.error('Error checking progress:', error);
            }
        };

        checkProgress();
    }, [userData?.id]);

    const completedCount = steps.filter(s => s.completed).length;
    const progress = (completedCount / steps.length) * 100;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-bold mb-2"
                >
                    Cześć, {userName}! 👋
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 text-lg"
                >
                    Zacznij śledzić swoje finanse w 3 prostych krokach
                </motion.p>
            </div>

            {/* Progress Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
            >
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Twój postęp</span>
                    <span className="text-emerald-400 font-medium">{completedCount} z {steps.length} kroków</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    />
                </div>
            </motion.div>

            {/* DOMINANT CTA - First uncompleted step */}
            {(() => {
                const nextStep = steps.find(s => !s.completed) || steps[0];
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                    >
                        <Link href={nextStep.href}>
                            <Card className="p-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50 transition-all cursor-pointer group">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <nextStep.icon className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h2 className="text-xl md:text-2xl font-bold mb-2">{nextStep.title}</h2>
                                        <p className="text-slate-400">{nextStep.description}</p>
                                    </div>
                                    <Button size="lg" className="group-hover:bg-emerald-600">
                                        Zaczynamy
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                );
            })()}

            {/* Steps List */}
            <div className="space-y-4 mb-8">
                {steps.map((step, i) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                    >
                        <Link href={step.href}>
                            <Card className={`p-4 transition-all hover:border-slate-600 ${step.completed ? 'bg-emerald-500/5 border-emerald-500/20' : ''
                                }`}>
                                <div className="flex items-center gap-4">
                                    {/* Step Number / Check */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step.completed
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400'
                                        }`}>
                                        {step.completed ? <Check className="w-5 h-5" /> : step.id}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className={`font-medium ${step.completed ? 'text-emerald-400' : ''}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-slate-500">{step.description}</p>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight className={`w-5 h-5 ${step.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Alternative Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap justify-center gap-4"
            >
                <Link href="/import">
                    <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Importuj z banku
                    </Button>
                </Link>
                <Link href="/expenses">
                    <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Dodaj ręcznie
                    </Button>
                </Link>
            </motion.div>

            {/* Motivation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full text-amber-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    Ukończ wszystkie kroki i odblokuj pełne AI Insights!
                </div>
            </motion.div>
        </div>
    );
}
