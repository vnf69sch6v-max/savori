'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Store, Calendar, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_LABELS, CATEGORY_ICONS, parseMoneyToCents } from '@/lib/utils';
import { logSecurityEvent, SecurityEvents } from '@/lib/security';
import { collection, addDoc, getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExpenseCategory, Budget } from '@/types';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { engagementService } from '@/lib/engagement/xp-system';
import ExpenseAnalysisCard from './ExpenseAnalysisCard';
import { fireMilestoneConfetti } from '@/hooks/useConfetti';

interface DetailedExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: {
        amount?: number;
        merchant?: string;
        category?: ExpenseCategory;
        date?: Date;
    };
}

const CATEGORIES: ExpenseCategory[] = [
    'groceries', 'restaurants', 'transport', 'utilities', 'entertainment',
    'shopping', 'health', 'education', 'subscriptions', 'other',
];

export default function DetailedExpenseModal({ isOpen, onClose, onSuccess, initialData }: DetailedExpenseModalProps) {
    const { userData } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [merchant, setMerchant] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('other');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Analysis state
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [savedExpense, setSavedExpense] = useState<any>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            if (initialData.amount) setAmount((initialData.amount / 100).toFixed(2).replace('.', ','));
            if (initialData.merchant) setMerchant(initialData.merchant);
            if (initialData.category) setCategory(initialData.category);
            if (initialData.date) setDate(initialData.date.toISOString().split('T')[0]);
        } else if (isOpen) {
            // Reset if opening fresh
            setAmount('');
            setMerchant('');
            setCategory('other');
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
        }
    }, [isOpen, initialData]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
            newErrors.amount = 'Podaj prawidłową kwotę';
        }
        if (!merchant.trim()) {
            newErrors.merchant = 'Podaj nazwę sklepu';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !userData?.id) return;
        setLoading(true);

        try {
            const amountInCents = parseMoneyToCents(amount);
            const expenseData = {
                userId: userData.id,
                createdAt: Timestamp.now(),
                date: Timestamp.fromDate(new Date(date)),
                merchant: { name: merchant.trim(), category },
                amount: amountInCents,
                currency: 'PLN',
                tags: [],
                notes: notes.trim() || null,
                metadata: { source: 'manual' as const, verified: true },
            };

            await addDoc(collection(db, 'users', userData.id, 'expenses'), expenseData);
            await logSecurityEvent(userData.id, SecurityEvents.expenseAdded(merchant, amountInCents));
            const { xp, newBadges } = await engagementService.awardXP(userData.id, 'add_expense_manual');
            const engagement = await engagementService.getEngagement(userData.id);

            const monthKey = format(new Date(), 'yyyy-MM');
            const budgetRef = doc(db, 'users', userData.id, 'budgets', monthKey);
            const budgetSnap = await getDoc(budgetRef);
            const budget = budgetSnap.exists() ? budgetSnap.data() as Budget : null;
            const monthlySpent = (budget?.totalSpent || 0) + amountInCents;

            setSavedExpense({ merchant: merchant.trim(), amount: amountInCents, category });
            setAnalysisData({
                aiComment: `Wydatek ${merchant} zapisany. ${budget ? `Pozostało ${((budget.totalLimit - monthlySpent) / 100).toFixed(2)} zł w budżecie.` : 'Ustaw budżet, aby śledzić wydatki!'}`,
                budgetRemaining: budget ? budget.totalLimit - monthlySpent : undefined,
                streak: engagement.currentStreak,
                xp,
            });
            setShowAnalysis(true);

            newBadges.forEach((badge, i) => {
                setTimeout(() => {
                    toast.success(`🏆 Nowa odznaka: ${badge.name}!`, { duration: 5000 });
                    fireMilestoneConfetti();
                }, i * 500);
            });

        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Nie udało się dodać wydatku');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAnalysis = () => {
        setShowAnalysis(false);
        onSuccess?.();
        onClose();
    };

    if (!isOpen && !showAnalysis) return null;

    if (showAnalysis && savedExpense) {
        return (
            <ExpenseAnalysisCard
                isOpen={showAnalysis}
                onClose={handleCloseAnalysis}
                expense={savedExpense}
                analysis={analysisData || undefined}
                loading={false}
            />
        );
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Szczegóły wydatku</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kwota *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">zł</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                                    placeholder="0,00"
                                    className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.amount ? 'border-red-500' : 'border-slate-700'}`}
                                />
                            </div>
                            {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Sklep / Usługodawca *</label>
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={merchant}
                                    onChange={(e) => setMerchant(e.target.value)}
                                    placeholder="np. Biedronka..."
                                    className={`w-full pl-12 pr-4 py-3 bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${errors.merchant ? 'border-red-500' : 'border-slate-700'}`}
                                />
                            </div>
                            {errors.merchant && <p className="mt-1 text-sm text-red-400">{errors.merchant}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kategoria *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${category === cat ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600'}`}
                                    >
                                        <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[cat]}</span>
                                        <span className="text-sm font-medium truncate">{CATEGORY_LABELS[cat]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Data</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Notatka</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Opcjonalnie..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full py-4 text-base bg-emerald-500 hover:bg-emerald-600 text-white">
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Zapisywanie...</> : '✓ Zapisz wydatek'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
