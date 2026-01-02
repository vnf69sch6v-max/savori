'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Plus,
    Camera,
    Search,
    Filter,
    Calendar,
    Trash2,
    Edit3,
    ChevronDown,
    Receipt,
    ArrowLeft
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, formatDate, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, ExpenseCategory } from '@/types';
import AddExpenseModal from '@/components/AddExpenseModal';
// Using GradientExpenseCard for consistency with Dashboard
import GradientExpenseCard from '@/components/GradientExpenseCard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ExpensesPage() {
    const { userData } = useAuth();
    const { t, language } = useLanguage();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'day'>('month'); // Prepare for day view if needed

    // Fetch expenses
    useEffect(() => {
        if (!userData?.id) {
            const timer = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timer);
        }

        const expensesRef = collection(db, 'users', userData.id, 'expenses');
        // Limit to prevent excessive reads - most users won't have 300+ expenses in view
        const q = query(expensesRef, orderBy('createdAt', 'desc'), limit(300));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            setExpenses(data);
            setTimeout(() => setLoading(false), 0);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Filter expenses - Memoized
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const matchesSearch = expense.merchant?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' ||
                expense.merchant?.category === selectedCategory;

            // Date Logic
            let expenseDate: Date;
            if (expense.date && typeof (expense.date as any).toDate === 'function') {
                expenseDate = (expense.date as any).toDate();
            } else if (expense.date) {
                expenseDate = new Date(expense.date as any);
            } else {
                expenseDate = new Date();
            }

            let matchesDate = true;
            if (viewMode === 'month') {
                const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
                matchesDate = expenseDate >= start && expenseDate <= end;
            }

            return matchesSearch && matchesCategory && matchesDate;
        });
    }, [expenses, searchQuery, selectedCategory, viewDate, viewMode]);

    // Calculate total - Memoized
    const totalAmount = useMemo(() =>
        filteredExpenses.reduce((sum: number, e: Expense) => sum + (e.amount || 0), 0),
        [filteredExpenses]);

    // Navigation Handlers
    const prevDate = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextDate = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    const resetDate = () => setViewDate(new Date());

    // Group by date - Memoized
    const groupedExpenses = useMemo(() => {
        return filteredExpenses.reduce((groups: Record<string, Expense[]>, expense: Expense) => {
            // Handle Firestore Timestamp or Date
            let dateObj: Date;
            if (expense.date && typeof (expense.date as any).toDate === 'function') {
                dateObj = (expense.date as any).toDate();
            } else if (expense.date) {
                dateObj = new Date(expense.date as any);
            } else {
                dateObj = new Date();
            }

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateLabel = formatDate(dateObj);
            if (dateObj.toDateString() === today.toDateString()) dateLabel = t('common.today');
            else if (dateObj.toDateString() === yesterday.toDateString()) dateLabel = t('common.yesterday');

            if (!groups[dateLabel]) {
                groups[dateLabel] = [];
            }
            groups[dateLabel].push(expense);
            return groups;
        }, {} as Record<string, Expense[]>);
    }, [filteredExpenses]);

    // Delete expense
    const handleDelete = async (expenseId: string) => {
        if (!userData?.id) return;

        try {
            await deleteDoc(doc(db, 'users', userData.id, 'expenses', expenseId));
            toast.success(t('expenses.expenseDeleted'));
        } catch (error) {
            console.error(error);
            toast.error(t('expenses.deleteError'));
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 lg:pb-0">
            {/* Fintech Header */}
            <div className="mb-8 relative">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="lg:hidden p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-300">{t('expenses.title')}</h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/scan">
                            <Button variant="outline" icon={<Camera className="w-5 h-5" />}>
                                Skanuj
                            </Button>
                        </Link>
                        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>
                            Dodaj
                        </Button>
                    </div>
                </div>

                {/* Date Navigator & Big Amount */}
                <div className="mt-6 flex flex-col items-center justify-center">
                    {/* Month Navigation */}
                    <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50 backdrop-blur-sm mb-4">
                        <button onClick={prevDate} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>

                        <div className="flex items-center gap-2 px-2 cursor-pointer hover:bg-slate-800/30 rounded-lg transition-colors py-1" onClick={resetDate}>
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span className="text-lg font-medium capitalize text-slate-200">
                                {viewDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <button onClick={nextDate} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
                            <ChevronDown className="w-5 h-5 -rotate-90" />
                        </button>
                    </div>

                    {/* Big Amount - Fintech Style */}
                    <div className="text-center relative">
                        <motion.h2
                            key={totalAmount}
                            initial={{ scale: 0.9, opacity: 0.5 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400"
                        >
                            {formatMoney(totalAmount).replace('zł', '')}
                            <span className="text-2xl text-slate-500 font-medium ml-2">zł</span>
                        </motion.h2>
                        <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-widest opacity-60">{t('expenses.totalSum')}</p>
                    </div>
                </div>
            </div>

            {/* Filters - Glassmorphism */}
            <div className="p-4 mb-6 bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-2xl sticky top-20 z-10 lg:static">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('expenses.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-500"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full md:w-auto pl-10 pr-10 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
                        >
                            <option value="all">{t('expenses.allCategories')}</option>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Expenses List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-24 rounded-2xl bg-slate-800/50" />
                    ))}
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="py-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
                    <Receipt className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2 text-white">{t('expenses.noExpenses')}</h3>
                    <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                        {searchQuery || selectedCategory !== 'all'
                            ? t('expenses.noMatchingExpenses')
                            : t('expenses.noExpensesDesc')}
                    </p>
                    <div className="flex justify-center gap-3">
                        <Link href="/scan">
                            <Button variant="outline" icon={<Camera className="w-5 h-5" />}>
                                {t('common.scan')}
                            </Button>
                        </Link>
                        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>
                            {t('expenses.addManually')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedExpenses).map(([date, expenses]) => (
                        <div key={date} className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-400 pl-1 sticky top-[150px] lg:static z-0 backdrop-blur-sm lg:backdrop-blur-none py-1">{date}</h3>
                            {expenses.map((expense) => (
                                <GradientExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Expense Modal */}
            <AddExpenseModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </div>
    );
}
