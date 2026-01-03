'use client';

/**
 * SmartExpenseModal - AI-First Expense Adding
 * One input → AI parses → One click to save
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Sparkles, Check, Loader2, Edit3, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/lib/expense-service';
import { formatAmountFromGrosze, getDateFromOffset, type ParsedVoiceExpense } from '@/lib/ai/voice-expense-parser';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { engagementService } from '@/lib/engagement/xp-system';
import { suggestBehavioralCategory, BEHAVIORAL_CATEGORIES } from '@/lib/behavioral-categories';
import DetailedExpenseModal from './DetailedExpenseModal';

interface SmartExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type ModalState = 'input' | 'processing' | 'preview' | 'saving' | 'success' | 'error';

// Animated placeholder examples
const PLACEHOLDER_EXAMPLES = [
    '50 zł Żabka',
    'wczoraj 200 Biedronka',
    '35 zł kawa Starbucks',
    'piątek Orlen 180 paliwo',
    '15 zł lunch',
];

export default function SmartExpenseModal({ isOpen, onClose, onSuccess }: SmartExpenseModalProps) {
    const router = useRouter();
    const { userData } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);

    const [state, setState] = useState<ModalState>('input');
    const [inputText, setInputText] = useState('');
    const [parsedExpense, setParsedExpense] = useState<ParsedVoiceExpense | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [savedAmount, setSavedAmount] = useState(0);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [showDetailedModal, setShowDetailedModal] = useState(false);

    // Animated placeholder
    useEffect(() => {
        if (!isOpen || state !== 'input') return;
        const interval = setInterval(() => {
            setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isOpen, state]);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen && state === 'input') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, state]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setState('input');
            setInputText('');
            setParsedExpense(null);
            setErrorMessage('');
            setShowDetailedModal(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || inputText.length < 3) return;

        setState('processing');
        setErrorMessage('');

        try {
            const response = await fetch('/api/parse-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: inputText.trim() }),
            });

            const result = await response.json();

            if (result.success && result.data) {
                setParsedExpense(result.data);
                setState('preview');
            } else {
                setErrorMessage(result.error || 'Nie rozpoznano wydatku. Spróbuj: "50 zł Żabka"');
                setState('error');
            }
        } catch {
            setErrorMessage('Błąd połączenia. Spróbuj ponownie.');
            setState('error');
        }
    };

    const handleSave = async () => {
        if (!parsedExpense || !userData?.id) return;

        setState('saving');

        try {
            const expenseDate = getDateFromOffset(parsedExpense.dateOffset);

            await expenseService.create({
                userId: userData.id,
                amount: parsedExpense.amount,
                merchant: {
                    name: parsedExpense.merchant || 'Wydatek',
                    category: parsedExpense.category,
                },
                date: expenseDate,
                source: 'manual',
                ...(parsedExpense.items.length > 0 && {
                    notes: `Produkty: ${parsedExpense.items.join(', ')}`
                }),
            });

            // Award XP
            await engagementService.awardXP(userData.id, 'add_expense_manual');

            setSavedAmount(parsedExpense.amount);
            setState('success');
            toast.success('Wydatek zapisany!');

            // Auto close after success animation
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Save error:', error);
            setErrorMessage('Nie udało się zapisać wydatku');
            setState('error');
        }
    };

    const handleRetry = () => {
        setState('input');
        setParsedExpense(null);
        setErrorMessage('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const behavioralCategory = parsedExpense
        ? suggestBehavioralCategory(parsedExpense.category)
        : null;
    const behavioralMeta = behavioralCategory
        ? BEHAVIORAL_CATEGORIES[behavioralCategory]
        : null;

    if (!isOpen) return null;

    if (showDetailedModal) {
        return (
            <DetailedExpenseModal
                isOpen={showDetailedModal}
                onClose={() => {
                    setShowDetailedModal(false);
                    onClose();
                }}
                onSuccess={onSuccess}
                initialData={parsedExpense ? {
                    amount: parsedExpense.amount,
                    merchant: parsedExpense.merchant || undefined,
                    category: parsedExpense.category,
                    date: getDateFromOffset(parsedExpense.dateOffset)
                } : undefined}
            />
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/80 to-black/60 backdrop-blur-md" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md mx-4 mb-4 sm:mb-0"
                >
                    <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/98 backdrop-blur-2xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10">

                        {/* Header */}
                        <div className="relative px-5 pt-5 pb-3">
                            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-white">Dodaj wydatek</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/50 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-5 pb-6">
                            <AnimatePresence mode="wait">

                                {/* Input State */}
                                {state === 'input' && (
                                    <motion.form
                                        key="input"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        onSubmit={handleSubmit}
                                        className="space-y-4"
                                    >
                                        <div className="relative">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={inputText}
                                                onChange={(e) => setInputText(e.target.value)}
                                                placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
                                                className="w-full h-14 px-4 pr-12 bg-slate-800/80 border border-slate-600/50 rounded-2xl 
                                                         text-white text-lg placeholder:text-slate-500 
                                                         focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 
                                                         transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={inputText.length < 3}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 
                                                         bg-gradient-to-r from-emerald-500 to-cyan-500 
                                                         hover:opacity-90 disabled:from-slate-700 disabled:to-slate-700 
                                                         text-white rounded-xl transition-all"
                                            >
                                                <Zap className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-2">
                                                💡 Wpisz naturalnie, np. "50 zł Żabka" lub "wczoraj 200 Biedronka"
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setShowDetailedModal(true)}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                lub wpisz ręcznie (formularz)
                                            </button>
                                        </div>
                                    </motion.form>
                                )}

                                {/* Processing State */}
                                {state === 'processing' && (
                                    <motion.div
                                        key="processing"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="py-12 text-center"
                                    >
                                        <div className="relative inline-block">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                className="w-16 h-16 rounded-full border-2 border-emerald-500/30 border-t-emerald-500"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="w-6 h-6 text-emerald-400" />
                                            </div>
                                        </div>
                                        <p className="text-slate-400 mt-4">AI analizuje...</p>
                                        <p className="text-xs text-slate-500 mt-1">"{inputText}"</p>
                                    </motion.div>
                                )}

                                {/* Preview State */}
                                {state === 'preview' && parsedExpense && (
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <p className="text-center text-xs text-slate-500">🪄 Rozpoznano z "{inputText}"</p>

                                        {/* Preview Card */}
                                        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
                                            {/* Amount - Hero */}
                                            <div className="text-center mb-4">
                                                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                                    {formatAmountFromGrosze(parsedExpense.amount)}
                                                </p>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                                    <span className="text-sm text-slate-400">Sklep</span>
                                                    <span className="text-white font-medium flex items-center gap-2">
                                                        <span className="text-lg">{CATEGORY_ICONS[parsedExpense.category]}</span>
                                                        {parsedExpense.merchant || 'Nieznany'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                                    <span className="text-sm text-slate-400">Kategoria</span>
                                                    <span className="text-white">{CATEGORY_LABELS[parsedExpense.category]}</span>
                                                </div>
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-sm text-slate-400">Data</span>
                                                    <span className="text-white">
                                                        {parsedExpense.dateOffset === 0 ? 'Dziś' :
                                                            parsedExpense.dateOffset === -1 ? 'Wczoraj' :
                                                                getDateFromOffset(parsedExpense.dateOffset).toLocaleDateString('pl-PL')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Behavioral Category Badge */}
                                            {behavioralMeta && (
                                                <div className="mt-4 pt-3 border-t border-slate-700/50">
                                                    <div className="flex items-center justify-center gap-2 text-xs">
                                                        <span className="text-slate-500">Kategoria behawioralna:</span>
                                                        <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1">
                                                            {behavioralMeta.emoji} {behavioralMeta.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-2">
                                            <Button
                                                onClick={handleSave}
                                                className="w-full py-4 text-base bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 hover:opacity-90"
                                            >
                                                <Check className="w-5 h-5 mr-2" />
                                                Zapisz wydatek
                                            </Button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRetry}
                                                    className="flex-1 py-2 text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors rounded-xl hover:bg-slate-800/50"
                                                >
                                                    Popraw wpis
                                                </button>
                                                <button
                                                    onClick={() => setShowDetailedModal(true)}
                                                    className="flex-1 py-2 text-sm text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-2 transition-colors rounded-xl hover:bg-emerald-500/10"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                    Szczegóły
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Saving State */}
                                {state === 'saving' && (
                                    <motion.div
                                        key="saving"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="py-12 text-center"
                                    >
                                        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                                        <p className="text-slate-400">Zapisuję...</p>
                                    </motion.div>
                                )}

                                {/* Success State */}
                                {state === 'success' && (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="py-8 text-center relative overflow-hidden"
                                    >
                                        {/* Confetti */}
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ y: -20, x: Math.random() * 200 - 100, opacity: 1 }}
                                                animate={{ y: 150, opacity: 0 }}
                                                transition={{ duration: 1.2, delay: Math.random() * 0.2 }}
                                                className={`absolute w-2 h-2 rounded-sm ${['bg-emerald-400', 'bg-cyan-400', 'bg-purple-400'][i % 3]
                                                    }`}
                                                style={{ left: `${Math.random() * 100}%` }}
                                            />
                                        ))}

                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 200 }}
                                            className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30"
                                        >
                                            <Check className="w-10 h-10 text-white" />
                                        </motion.div>
                                        <p className="text-emerald-400 text-3xl font-bold mb-1">
                                            {formatAmountFromGrosze(savedAmount)}
                                        </p>
                                        <p className="text-white text-lg font-semibold">Zapisano!</p>
                                    </motion.div>
                                )}

                                {/* Error State */}
                                {state === 'error' && (
                                    <motion.div
                                        key="error"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="py-8 text-center"
                                    >
                                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8 text-red-400" />
                                        </div>
                                        <p className="text-red-400 mb-4">{errorMessage}</p>
                                        <Button onClick={handleRetry}>
                                            Spróbuj ponownie
                                        </Button>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
