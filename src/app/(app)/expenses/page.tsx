'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, formatDate, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, ExpenseCategory } from '@/types';
import AddExpenseModal from '@/components/AddExpenseModal';

export default function ExpensesPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Fetch expenses
    useEffect(() => {
        if (!userData?.id) {
            setLoading(false);
            return;
        }

        const expensesRef = collection(db, 'users', userData.id, 'expenses');
        const q = query(expensesRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            setExpenses(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    // Filter expenses
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.merchant?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' ||
            expense.merchant?.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Group by date
    const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
        const date = expense.date?.toDate?.() || new Date();
        const dateStr = date.toISOString().split('T')[0];
        if (!groups[dateStr]) {
            groups[dateStr] = [];
        }
        groups[dateStr].push(expense);
        return groups;
    }, {} as Record<string, Expense[]>);

    // Calculate total
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Delete expense
    const handleDelete = async (expenseId: string) => {
        if (!userData?.id) return;

        try {
            await deleteDoc(doc(db, 'users', userData.id, 'expenses', expenseId));
            toast.success('Wydatek usunięty');
        } catch (error) {
            console.error(error);
            toast.error('Nie udało się usunąć wydatku');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Wydatki</h1>
                    <p className="text-slate-400 mt-1">
                        Suma: <span className="text-rose-400 font-medium">{formatMoney(totalAmount)}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/scan">
                        <Button icon={<Camera className="w-5 h-5" />}>
                            Skanuj
                        </Button>
                    </Link>
                    <Button variant="outline" icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>
                        Dodaj ręcznie
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Szukaj wydatków..."
                            icon={<Search className="w-5 h-5" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="all">Wszystkie kategorie</option>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                                {CATEGORY_ICONS[key]} {label}
                            </option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Expenses List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton h-20 rounded-xl" />
                    ))}
                </div>
            ) : filteredExpenses.length === 0 ? (
                <Card className="p-12 text-center">
                    <Receipt className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Brak wydatków</h3>
                    <p className="text-slate-400 mb-6">
                        {searchQuery || selectedCategory !== 'all'
                            ? 'Nie znaleziono wydatków pasujących do filtrów'
                            : 'Dodaj swój pierwszy wydatek, skanując paragon lub ręcznie'}
                    </p>
                    <Link href="/scan">
                        <Button icon={<Camera className="w-5 h-5" />}>
                            Skanuj paragon
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedExpenses).map(([dateStr, dayExpenses], groupIndex) => (
                        <motion.div
                            key={dateStr}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {formatDate(new Date(dateStr), 'long')}
                                    </span>
                                </div>
                                <span className="text-sm text-slate-500">
                                    {formatMoney(dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                                </span>
                            </div>

                            <Card className="divide-y divide-slate-700/50">
                                {dayExpenses.map((expense, i) => (
                                    <motion.div
                                        key={expense.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                                            {CATEGORY_ICONS[expense.merchant?.category] || '📦'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{expense.merchant?.name || 'Nieznany'}</p>
                                            <p className="text-sm text-slate-400">
                                                {CATEGORY_LABELS[expense.merchant?.category] || 'Inne'}
                                                {expense.items && expense.items.length > 0 && (
                                                    <span className="ml-2 text-slate-500">
                                                        • {expense.items.length} produktów
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-rose-400">
                                                -{formatMoney(expense.amount)}
                                            </p>
                                            {expense.metadata?.source === 'scan' && (
                                                <span className="text-xs text-emerald-400">AI</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </Card>
                        </motion.div>
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
