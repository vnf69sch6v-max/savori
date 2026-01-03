'use client';

/**
 * Behavioral Budget Page - ULTRA PREMIUM
 * Kakeibo 2.0 - Fortress vs Life with collapsible sections and gradients
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Sparkles, Crown, ChevronDown, ChevronUp, Settings, X, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, getDocs, where, Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, BehavioralCategory } from '@/types';
import {
    getFortressCategories,
    getLifeCategories,
    suggestBehavioralCategory,
    BEHAVIORAL_CATEGORIES,
} from '@/lib/behavioral-categories';

// Default limits (in grosze) - fallback when no user settings
const DEFAULT_LIMITS: Record<BehavioralCategory, number> = {
    fortress: 200000,
    shield: 50000,
    fuel: 80000,
    dopamine: 50000,
    micro_joy: 30000,
    xp_points: 60000,
    for_me: 40000,
    social_glue: 60000,
    love_language: 30000,
    tribe_tax: 20000,
    chaos_tax: 10000,
    impulse_zone: 40000,
};

// Category gradient colors
const CATEGORY_COLORS: Record<BehavioralCategory, { gradient: string; bar: string; bg: string }> = {
    fortress: { gradient: 'from-slate-500 to-slate-700', bar: 'bg-slate-400', bg: 'bg-slate-500/20' },
    shield: { gradient: 'from-blue-500 to-blue-700', bar: 'bg-blue-500', bg: 'bg-blue-500/20' },
    fuel: { gradient: 'from-emerald-500 to-emerald-700', bar: 'bg-emerald-500', bg: 'bg-emerald-500/20' },
    dopamine: { gradient: 'from-purple-500 to-pink-600', bar: 'bg-purple-500', bg: 'bg-purple-500/20' },
    micro_joy: { gradient: 'from-amber-500 to-orange-600', bar: 'bg-amber-500', bg: 'bg-amber-500/20' },
    xp_points: { gradient: 'from-cyan-500 to-blue-600', bar: 'bg-cyan-500', bg: 'bg-cyan-500/20' },
    for_me: { gradient: 'from-teal-500 to-emerald-600', bar: 'bg-teal-500', bg: 'bg-teal-500/20' },
    social_glue: { gradient: 'from-rose-500 to-pink-600', bar: 'bg-rose-500', bg: 'bg-rose-500/20' },
    love_language: { gradient: 'from-red-500 to-rose-600', bar: 'bg-red-500', bg: 'bg-red-500/20' },
    tribe_tax: { gradient: 'from-indigo-500 to-purple-600', bar: 'bg-indigo-500', bg: 'bg-indigo-500/20' },
    chaos_tax: { gradient: 'from-gray-500 to-gray-700', bar: 'bg-gray-500', bg: 'bg-gray-500/20' },
    impulse_zone: { gradient: 'from-yellow-500 to-amber-600', bar: 'bg-yellow-500', bg: 'bg-yellow-500/20' },
};

// ============ Settings Modal ============
function BehavioralSettingsModal({
    isOpen,
    onClose,
    limits,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    limits: Record<BehavioralCategory, number>;
    onSave: (newLimits: Record<BehavioralCategory, number>) => Promise<void>;
}) {
    const [editedLimits, setEditedLimits] = useState(limits);
    const [saving, setSaving] = useState(false);

    const fortressCategories = getFortressCategories();
    const lifeCategories = getLifeCategories();

    useEffect(() => {
        setEditedLimits(limits);
    }, [limits, isOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(editedLimits);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const totalLimit = Object.values(editedLimits).reduce((a, b) => a + b, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-t-3xl sm:rounded-3xl"
            >
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 flex items-center justify-between p-4 border-b border-slate-800 z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Ustaw limity</h2>
                        <p className="text-xs text-slate-400">
                            Suma: {(totalLimit / 100).toLocaleString('pl-PL')} zł/mies.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium 
                                     hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Zapisz
                        </button>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-6">
                    {/* Fortress Section */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> 🏰 Twierdza
                        </h3>
                        <div className="space-y-2">
                            {fortressCategories.map((cat) => (
                                <LimitInput
                                    key={cat.id}
                                    categoryId={cat.id}
                                    value={editedLimits[cat.id]}
                                    onChange={(v) => setEditedLimits((prev) => ({ ...prev, [cat.id]: v }))}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Life Section */}
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> 🌈 Życie
                        </h3>
                        <div className="space-y-2">
                            {lifeCategories.map((cat) => (
                                <LimitInput
                                    key={cat.id}
                                    categoryId={cat.id}
                                    value={editedLimits[cat.id]}
                                    onChange={(v) => setEditedLimits((prev) => ({ ...prev, [cat.id]: v }))}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function LimitInput({
    categoryId,
    value,
    onChange,
}: {
    categoryId: BehavioralCategory;
    value: number;
    onChange: (value: number) => void;
}) {
    const meta = BEHAVIORAL_CATEGORIES[categoryId];
    const colors = CATEGORY_COLORS[categoryId];
    const [inputValue, setInputValue] = useState((value / 100).toString());

    const handleBlur = () => {
        const parsed = parseFloat(inputValue) || 0;
        onChange(Math.round(parsed * 100));
    };

    useEffect(() => {
        setInputValue((value / 100).toString());
    }, [value]);

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} border border-transparent`}>
            <span className="text-lg">{meta.emoji}</span>
            <span className="flex-1 text-sm text-white font-medium">{meta.name}</span>
            <div className="relative w-24">
                <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-1.5 text-right text-sm bg-slate-800/80 border border-slate-600/50 
                             rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                    zł
                </span>
            </div>
        </div>
    );
}

// ============ Category Item ============
function CategoryItem({
    categoryId,
    spent,
    limit,
    isExpanded,
    onToggle,
}: {
    categoryId: BehavioralCategory;
    spent: number;
    limit: number;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const meta = BEHAVIORAL_CATEGORIES[categoryId];
    const colors = CATEGORY_COLORS[categoryId];
    const percentage = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const isOver = spent > limit;

    return (
        <motion.div layout className="overflow-hidden">
            <motion.button
                onClick={onToggle}
                className={`w-full p-3 rounded-xl border transition-all ${isExpanded
                        ? `border-transparent bg-gradient-to-r ${colors.gradient}`
                        : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/50'
                    }`}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${isExpanded ? 'bg-white/20' : colors.bg} flex items-center justify-center text-xl`}>
                        {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className={`font-medium text-sm ${isExpanded ? 'text-white' : 'text-slate-200'}`}>
                                {meta.name}
                            </span>
                            <span className={`text-sm font-bold ${isOver ? 'text-red-400' : isExpanded ? 'text-white' : 'text-slate-200'}`}>
                                {(spent / 100).toFixed(0)}
                                <span className={`font-normal ${isExpanded ? 'text-white/60' : 'text-slate-500'}`}> / {(limit / 100).toFixed(0)}</span>
                            </span>
                        </div>
                        <div className={`h-1 rounded-full overflow-hidden ${isExpanded ? 'bg-white/20' : 'bg-slate-700'}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full ${isExpanded ? 'bg-white' : colors.bar}`}
                            />
                        </div>
                    </div>
                    <div className={isExpanded ? 'text-white/60' : 'text-slate-500'}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </motion.button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className={`mt-1 p-3 rounded-xl bg-gradient-to-r ${colors.gradient} bg-opacity-50`}>
                            <p className="text-xs text-white/70 mb-2">{meta.description}</p>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/60">💡 {meta.psychTrigger}</span>
                                <span className={`px-2 py-0.5 rounded-full ${isOver ? 'bg-red-500/30 text-red-200' : 'bg-white/20 text-white'
                                    }`}>
                                    {isOver ? `Przekroczono o ${((spent - limit) / 100).toFixed(0)} zł` : `Zostało ${((limit - spent) / 100).toFixed(0)} zł`}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============ Collapsible Section ============
function CollapsibleSection({
    title,
    emoji,
    icon: Icon,
    total,
    categories,
    spentByCategory,
    limits,
    expandedCategory,
    onCategoryToggle,
    gradient,
}: {
    title: string;
    emoji: string;
    icon: typeof Shield;
    total: number;
    categories: { id: BehavioralCategory }[];
    spentByCategory: Record<BehavioralCategory, number>;
    limits: Record<BehavioralCategory, number>;
    expandedCategory: BehavioralCategory | null;
    onCategoryToggle: (id: BehavioralCategory) => void;
    gradient: string;
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <motion.div layout className="overflow-hidden">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-3 rounded-2xl mb-2 flex items-center gap-3 transition-all ${isOpen
                        ? `bg-gradient-to-r ${gradient} border border-transparent`
                        : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50'
                    }`}
                whileTap={{ scale: 0.98 }}
            >
                <div className={`w-10 h-10 rounded-xl ${isOpen ? 'bg-white/20' : 'bg-slate-700/50'} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${isOpen ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 text-left">
                    <span className={`font-semibold ${isOpen ? 'text-white' : 'text-slate-200'}`}>
                        {emoji} {title}
                    </span>
                    <p className={`text-xs ${isOpen ? 'text-white/60' : 'text-slate-500'}`}>
                        {categories.length} kategorii • {(total / 100).toLocaleString('pl-PL')} zł
                    </p>
                </div>
                <div className={isOpen ? 'text-white/60' : 'text-slate-500'}>
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1.5 pb-2"
                    >
                        {categories.map((cat) => (
                            <CategoryItem
                                key={cat.id}
                                categoryId={cat.id}
                                spent={spentByCategory[cat.id] || 0}
                                limit={limits[cat.id]}
                                isExpanded={expandedCategory === cat.id}
                                onToggle={() => onCategoryToggle(cat.id)}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============ Main Page ============
export default function BehavioralBudgetPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState<BehavioralCategory | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [limits, setLimits] = useState<Record<BehavioralCategory, number>>(DEFAULT_LIMITS);

    const isUltra = userData?.subscription?.plan === 'ultra';
    const fortressCategories = getFortressCategories();
    const lifeCategories = getLifeCategories();

    // Fetch limits from Firestore
    useEffect(() => {
        if (!userData?.id || !isUltra) return;

        const fetchLimits = async () => {
            const limitsRef = doc(db, 'users', userData.id, 'settings', 'behavioralBudget');
            const snap = await getDoc(limitsRef);
            if (snap.exists()) {
                const data = snap.data();
                setLimits({ ...DEFAULT_LIMITS, ...data.limits });
            }
        };

        fetchLimits();
    }, [userData?.id, isUltra]);

    // Fetch expenses
    useEffect(() => {
        if (!userData?.id || !isUltra) {
            setLoading(false);
            return;
        }

        const fetchExpenses = async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const expensesRef = collection(db, 'users', userData.id, 'expenses');
            const q = query(
                expensesRef,
                where('date', '>=', Timestamp.fromDate(startOfMonth)),
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            })) as Expense[];

            setExpenses(data);
            setLoading(false);
        };

        fetchExpenses();
    }, [userData?.id, isUltra]);

    // Save limits to Firestore
    const handleSaveLimits = async (newLimits: Record<BehavioralCategory, number>) => {
        if (!userData?.id) return;

        const limitsRef = doc(db, 'users', userData.id, 'settings', 'behavioralBudget');
        await setDoc(limitsRef, { limits: newLimits, updatedAt: Timestamp.now() }, { merge: true });
        setLimits(newLimits);
        toast.success('Limity zapisane!');
    };

    const spentByCategory = useMemo(() => {
        const result: Record<BehavioralCategory, number> = {} as Record<BehavioralCategory, number>;
        Object.keys(limits).forEach((cat) => {
            result[cat as BehavioralCategory] = 0;
        });
        expenses.forEach((expense) => {
            const mccCategory = expense.merchant?.category || 'other';
            const behavioralCat = suggestBehavioralCategory(mccCategory);
            result[behavioralCat] = (result[behavioralCat] || 0) + expense.amount;
        });
        return result;
    }, [expenses, limits]);

    const fortressTotal = useMemo(() => {
        return fortressCategories.reduce((sum, cat) => sum + (spentByCategory[cat.id] || 0), 0);
    }, [fortressCategories, spentByCategory]);

    const lifeTotal = useMemo(() => {
        return lifeCategories.reduce((sum, cat) => sum + (spentByCategory[cat.id] || 0), 0);
    }, [lifeCategories, spentByCategory]);

    const totalBudget = Object.values(limits).reduce((a, b) => a + b, 0);
    const totalSpent = fortressTotal + lifeTotal;
    const remaining = totalBudget - totalSpent;
    const percentage = Math.min(100, (totalSpent / totalBudget) * 100);

    const handleCategoryToggle = (id: BehavioralCategory) => {
        setExpandedCategory((prev) => (prev === id ? null : id));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    // ULTRA GATE
    if (!isUltra) {
        return (
            <div className="min-h-screen bg-slate-950 pb-24 overflow-hidden">
                <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
                    <div className="max-w-lg mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/budgets" className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-400" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-white">Budżet Behawioralny</h1>
                                <p className="text-sm text-slate-400">Kakeibo 2.0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-6">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950 z-10" />
                        <div className="blur-[2px] opacity-50 pointer-events-none space-y-2">
                            {[
                                { emoji: '🏰', name: 'Twierdza', color: 'from-slate-500 to-slate-700' },
                                { emoji: '🎢', name: 'Dopamina', color: 'from-purple-500 to-pink-600' },
                                { emoji: '🍷', name: 'Smar Społeczny', color: 'from-rose-500 to-pink-600' },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`p-3 rounded-xl bg-gradient-to-r ${item.color}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{item.emoji}</span>
                                        <span className="text-white font-medium">{item.name}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring' }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4"
                        >
                            <Crown className="w-8 h-8 text-white" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-white mb-2">Odblokuj Pełne Kolory</h2>
                        <p className="text-sm text-slate-300 mb-4">Psychologiczne kategorie z gradientami</p>
                        <Link href="/settings/billing">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500"
                            >
                                Ulepsz do Ultra
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
                <div className="max-w-lg mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link href="/budgets" className="p-2 -ml-2 rounded-xl hover:bg-slate-800 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-lg font-bold text-white">Budżet Behawioralny</h1>
                            <p className="text-xs text-slate-400">Kakeibo 2.0</p>
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <Settings className="w-5 h-5 text-slate-400" />
                        </button>
                        <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full border border-purple-500/30">
                            👑 ULTRA
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* Compact Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs text-slate-400">Budżet</p>
                            <p className="text-2xl font-bold text-white">
                                {(totalBudget / 100).toLocaleString('pl-PL')} zł
                            </p>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-right ${remaining >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                            <p className={`text-xs ${remaining >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                {remaining >= 0 ? 'Zostało' : 'Przekroczono'}
                            </p>
                            <p className={`text-lg font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(Math.abs(remaining) / 100).toLocaleString('pl-PL')} zł
                            </p>
                        </div>
                    </div>

                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 text-center">{percentage.toFixed(0)}% wykorzystane</p>
                </motion.div>

                {/* Collapsible Sections */}
                <CollapsibleSection
                    title="Twierdza"
                    emoji="🏰"
                    icon={Shield}
                    total={fortressTotal}
                    categories={fortressCategories}
                    spentByCategory={spentByCategory}
                    limits={limits}
                    expandedCategory={expandedCategory}
                    onCategoryToggle={handleCategoryToggle}
                    gradient="from-slate-600 to-slate-800"
                />

                <CollapsibleSection
                    title="Życie"
                    emoji="🌈"
                    icon={Sparkles}
                    total={lifeTotal}
                    categories={lifeCategories}
                    spentByCategory={spentByCategory}
                    limits={limits}
                    expandedCategory={expandedCategory}
                    onCategoryToggle={handleCategoryToggle}
                    gradient="from-purple-600 to-pink-600"
                />
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <BehavioralSettingsModal
                        isOpen={showSettings}
                        onClose={() => setShowSettings(false)}
                        limits={limits}
                        onSave={handleSaveLimits}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
