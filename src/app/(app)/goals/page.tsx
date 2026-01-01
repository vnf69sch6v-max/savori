'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Target,
    Trash2,
    Edit3,
    Pause,
    Play,
    X,
    Check,
    Sparkles,
    TrendingUp,
    Calendar,
    Coins,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, parseMoneyToCents } from '@/lib/utils';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SavingGoal, Expense } from '@/types';
import { fireGoalConfetti } from '@/hooks/useConfetti';
import SmartGoalAdvisor from '@/components/goals/SmartGoalAdvisor';

const GOAL_EMOJIS = ['🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🎯', '🎁', '🏝️', '🎸', '🐶'];

export default function GoalsPage() {
    const { userData } = useAuth();
    const [goals, setGoals] = useState<SavingGoal[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGoalForAdvisor, setSelectedGoalForAdvisor] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState<string | null>(null);
    const [newGoal, setNewGoal] = useState({
        name: '',
        emoji: '🎯',
        targetAmount: '',
        deadline: '',
    });
    const [contributeAmount, setContributeAmount] = useState('');

    // Fetch goals
    useEffect(() => {
        if (!userData?.id) {
            setTimeout(() => setLoading(false), 0);
            return;
        }

        const goalsRef = collection(db, 'users', userData.id, 'goals');
        const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SavingGoal[];
            setGoals(data.sort((a, b) => {
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;
                return 0;
            }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Fetch expenses for AI advisor - LIMITED to reduce reads
    useEffect(() => {
        if (!userData?.id) return;
        // Only fetch expenses if an advisor panel is open
        if (!selectedGoalForAdvisor) {
            setExpenses([]);
            return;
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const expensesRef = collection(db, 'users', userData.id, 'expenses');
        const q = query(expensesRef, where('date', '>=', Timestamp.fromDate(startOfMonth)), orderBy('date', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
            setExpenses(data);
        });

        return () => unsubscribe();
    }, [userData?.id, selectedGoalForAdvisor]);

    // Create goal
    const handleCreateGoal = async () => {
        if (!userData?.id) return;
        if (!newGoal.name || !newGoal.targetAmount) {
            toast.error('Wypełnij nazwę i kwotę');
            return;
        }

        try {
            const goalData = {
                userId: userData.id,
                createdAt: Timestamp.now(),
                name: newGoal.name,
                emoji: newGoal.emoji,
                targetAmount: parseMoneyToCents(newGoal.targetAmount),
                currentAmount: 0,
                currency: 'PLN',
                deadline: newGoal.deadline ? Timestamp.fromDate(new Date(newGoal.deadline)) : null,
                priority: 'medium',
                status: 'active',
                autoSaveRules: [],
                contributions: [],
            };

            await addDoc(collection(db, 'users', userData.id, 'goals'), goalData);
            toast.success('Cel utworzony! 🎯');
            setShowAddModal(false);
            setNewGoal({ name: '', emoji: '🎯', targetAmount: '', deadline: '' });
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się utworzyć celu');
        }
    };

    // Add contribution
    const handleContribute = async () => {
        if (!userData?.id || !showContributeModal || !contributeAmount) return;

        try {
            const goal = goals.find(g => g.id === showContributeModal);
            if (!goal) return;

            const amount = parseMoneyToCents(contributeAmount);
            const newAmount = (goal.currentAmount || 0) + amount;
            const isCompleted = newAmount >= goal.targetAmount;

            await updateDoc(doc(db, 'users', userData.id, 'goals', showContributeModal), {
                currentAmount: newAmount,
                status: isCompleted ? 'completed' : 'active',
            });

            if (isCompleted) {
                toast.success('Gratulacje! Cel osiągnięty! 🎉');
                // Fire confetti celebration!
                setTimeout(() => fireGoalConfetti(), 300);
            } else {
                toast.success('Wpłata dodana!');
            }

            setShowContributeModal(null);
            setContributeAmount('');
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się dodać wpłaty');
        }
    };

    // Delete goal
    const handleDelete = async (goalId: string) => {
        if (!userData?.id) return;

        try {
            await deleteDoc(doc(db, 'users', userData.id, 'goals', goalId));
            toast.success('Cel usunięty');
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się usunąć celu');
        }
    };

    // Toggle pause/active
    const togglePause = async (goalId: string, currentStatus: string) => {
        if (!userData?.id) return;

        try {
            await updateDoc(doc(db, 'users', userData.id, 'goals', goalId), {
                status: currentStatus === 'paused' ? 'active' : 'paused',
            });
            toast.success(currentStatus === 'paused' ? 'Cel wznowiony' : 'Cel wstrzymany');
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate stats
    const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Cele oszczędnościowe</h1>
                    <p className="text-slate-400 mt-1">
                        Zaoszczędzone: <span className="text-emerald-400 font-medium">{formatMoney(totalSaved)}</span>
                        {totalTarget > 0 && (
                            <span className="text-slate-500"> / {formatMoney(totalTarget)}</span>
                        )}
                    </p>
                </div>
                <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>
                    Nowy cel
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4">
                    <p className="text-sm text-slate-400 mb-1">Aktywne</p>
                    <p className="text-2xl font-bold text-emerald-400">{activeGoals}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-slate-400 mb-1">Ukończone</p>
                    <p className="text-2xl font-bold text-amber-400">{completedGoals}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-slate-400 mb-1">Zaoszczędzone</p>
                    <p className="text-xl font-bold">{formatMoney(totalSaved)}</p>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-slate-400 mb-1">Postęp</p>
                    <p className="text-xl font-bold">
                        {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
                    </p>
                </Card>
            </div>

            {/* Goals List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-32 rounded-xl" />
                    ))}
                </div>
            ) : goals.length === 0 ? (
                <Card className="p-12 text-center">
                    <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Brak celów</h3>
                    <p className="text-slate-400 mb-6">
                        Stwórz swój pierwszy cel oszczędnościowy i zacznij odkładać pieniądze
                    </p>
                    <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>
                        Stwórz cel
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {goals.map((goal, i) => {
                        const progress = goal.targetAmount > 0
                            ? Math.min((goal.currentAmount || 0) / goal.targetAmount * 100, 100)
                            : 0;
                        const isCompleted = goal.status === 'completed';
                        const isPaused = goal.status === 'paused';

                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className={`p-5 ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : ''} ${isPaused ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{goal.emoji}</span>
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    {goal.name}
                                                    {isCompleted && <Check className="w-5 h-5 text-emerald-400" />}
                                                </h3>
                                                <p className="text-sm text-slate-400">
                                                    {formatMoney(goal.currentAmount || 0)} / {formatMoney(goal.targetAmount)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isCompleted && (
                                                <>
                                                    <button
                                                        onClick={() => togglePause(goal.id, goal.status)}
                                                        className="p-2 text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowContributeModal(goal.id)}
                                                        className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                                                    >
                                                        <Coins className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(goal.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className={`h-full rounded-full ${isCompleted
                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                                : 'bg-gradient-to-r from-blue-500 to-blue-400'
                                                }`}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">
                                            {Math.round(progress)}% ukończone
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {!isCompleted && (
                                                <button
                                                    onClick={() => setSelectedGoalForAdvisor(
                                                        selectedGoalForAdvisor === goal.id ? null : goal.id
                                                    )}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${selectedGoalForAdvisor === goal.id
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'text-slate-400 hover:text-purple-400'
                                                        }`}
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    AI
                                                </button>
                                            )}
                                            {goal.deadline && (
                                                <span className="text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(goal.deadline.toDate()).toLocaleDateString('pl-PL')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Advisor Panel */}
                                    <AnimatePresence>
                                        {selectedGoalForAdvisor === goal.id && expenses.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4"
                                            >
                                                <SmartGoalAdvisor
                                                    goal={goal}
                                                    expenses={expenses}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card className="w-full max-w-md p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Nowy cel</h2>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="p-2 text-slate-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Emoji picker */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Ikona
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {GOAL_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setNewGoal({ ...newGoal, emoji })}
                                                    className={`w-10 h-10 rounded-lg text-xl hover:bg-slate-700 transition-colors ${newGoal.emoji === emoji ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 'bg-slate-800'
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Input
                                        label="Nazwa celu"
                                        placeholder="np. Wakacje w Grecji"
                                        value={newGoal.name}
                                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                    />

                                    <Input
                                        label="Kwota docelowa (PLN)"
                                        type="number"
                                        placeholder="5000"
                                        value={newGoal.targetAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                    />

                                    <Input
                                        label="Termin (opcjonalnie)"
                                        type="date"
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    />

                                    <div className="flex gap-3 pt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                                            Anuluj
                                        </Button>
                                        <Button className="flex-1" onClick={handleCreateGoal}>
                                            Utwórz cel
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contribute Modal */}
            <AnimatePresence>
                {showContributeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur"
                        onClick={() => setShowContributeModal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card className="w-full max-w-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Dodaj wpłatę</h2>
                                    <button
                                        onClick={() => setShowContributeModal(null)}
                                        className="p-2 text-slate-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <Input
                                        label="Kwota (PLN)"
                                        type="number"
                                        placeholder="100"
                                        value={contributeAmount}
                                        onChange={(e) => setContributeAmount(e.target.value)}
                                    />

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setShowContributeModal(null)}>
                                            Anuluj
                                        </Button>
                                        <Button className="flex-1" onClick={handleContribute}>
                                            Wpłać
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
