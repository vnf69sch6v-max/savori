'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/lib/expense-service';
import { formatAmountFromGrosze, getDateFromOffset } from '@/lib/ai/voice-expense-parser';
import type { ParsedVoiceExpense } from '@/lib/ai/voice-expense-parser';
import type { ExpenseCategory } from '@/types';
import { toast } from 'react-hot-toast';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    groceries: '🛒 Spożywcze',
    restaurants: '🍽️ Restauracje',
    transport: '🚗 Transport',
    utilities: '💡 Rachunki',
    entertainment: '🎬 Rozrywka',
    shopping: '🛍️ Zakupy',
    health: '💊 Zdrowie',
    education: '📚 Edukacja',
    subscriptions: '📱 Subskrypcje',
    other: '📦 Inne',
};

interface VoiceExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalState = 'idle' | 'listening' | 'processing' | 'preview' | 'saving' | 'success' | 'error';

export default function VoiceExpenseModal({ isOpen, onClose }: VoiceExpenseModalProps) {
    const { userData } = useAuth();
    const [state, setState] = useState<ModalState>('idle');
    const [parsedExpense, setParsedExpense] = useState<ParsedVoiceExpense | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);

    const {
        transcript,
        interimTranscript,
        isListening,
        isSupported,
        error: speechError,
        startListening,
        stopListening,
        resetTranscript,
    } = useSpeechRecognition();

    // Start listening when modal opens
    useEffect(() => {
        if (isOpen && state === 'idle' && isSupported) {
            handleStartListening();
        }
    }, [isOpen]);

    // Process transcript when speech ends
    useEffect(() => {
        if (!isListening && transcript && state === 'listening') {
            processTranscript(transcript);
        }
    }, [isListening, transcript, state]);

    // Handle speech errors
    useEffect(() => {
        if (speechError) {
            setErrorMessage(speechError);
            setState('error');
        }
    }, [speechError]);

    const handleStartListening = () => {
        resetTranscript();
        setErrorMessage(null);
        setParsedExpense(null);
        setState('listening');
        startListening();
    };

    const handleStopListening = () => {
        stopListening();
    };

    const processTranscript = async (text: string) => {
        setState('processing');

        try {
            const response = await fetch('/api/parse-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text }),
            });

            const result = await response.json();

            if (result.success && result.data) {
                setParsedExpense(result.data);
                setState('preview');
            } else {
                setErrorMessage(result.error || 'Nie udało się rozpoznać wydatku');
                setState('error');
            }
        } catch (error) {
            console.error('Process error:', error);
            setErrorMessage('Błąd połączenia. Spróbuj ponownie.');
            setState('error');
        }
    };

    const handleSaveExpense = async () => {
        if (!parsedExpense || !userData?.id) return;

        setState('saving');

        try {
            const expenseDate = getDateFromOffset(parsedExpense.dateOffset);

            await expenseService.create({
                userId: userData.id,
                amount: parsedExpense.amount,
                merchant: {
                    name: parsedExpense.merchant || 'Wydatek głosowy',
                    category: parsedExpense.category,
                },
                date: expenseDate,
                source: 'manual',
                notes: parsedExpense.items.length > 0
                    ? `Produkty: ${parsedExpense.items.join(', ')}`
                    : undefined,
            });

            setState('success');
            toast.success('Wydatek dodany! 🎉');

            // Close after success animation
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (error) {
            console.error('Save error:', error);
            setErrorMessage('Nie udało się zapisać wydatku');
            setState('error');
        }
    };

    const handleClose = () => {
        stopListening();
        resetTranscript();
        setState('idle');
        setParsedExpense(null);
        setErrorMessage(null);
        onClose();
    };

    const handleRetry = () => {
        handleStartListening();
    };

    const updateParsedExpense = (field: keyof ParsedVoiceExpense, value: unknown) => {
        if (parsedExpense) {
            setParsedExpense({ ...parsedExpense, [field]: value });
        }
        setEditingField(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md"
                >
                    <Card className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <h2 className="text-lg font-semibold text-white">
                                {state === 'listening' && '🎤 Słucham...'}
                                {state === 'processing' && '🤔 Analizuję...'}
                                {state === 'preview' && '✨ Rozpoznany wydatek'}
                                {state === 'saving' && '💾 Zapisuję...'}
                                {state === 'success' && '✅ Dodano!'}
                                {state === 'error' && '❌ Błąd'}
                                {state === 'idle' && '🎤 Dodaj głosowo'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Listening State */}
                            {(state === 'listening' || state === 'idle') && (
                                <div className="text-center py-8">
                                    {/* Microphone Button */}
                                    <div className="relative inline-block mb-6">
                                        {/* Pulse rings */}
                                        {isListening && (
                                            <>
                                                <motion.div
                                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-full bg-emerald-500/30"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                                    className="absolute inset-0 rounded-full bg-emerald-500/20"
                                                />
                                            </>
                                        )}

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={isListening ? handleStopListening : handleStartListening}
                                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${isListening
                                                ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/40'
                                                : 'bg-slate-800 hover:bg-slate-700'
                                                }`}
                                        >
                                            {isListening ? (
                                                <Mic className="w-10 h-10 text-white" />
                                            ) : (
                                                <MicOff className="w-10 h-10 text-slate-400" />
                                            )}
                                        </motion.button>
                                    </div>

                                    {/* Transcript */}
                                    <div className="min-h-[60px] mb-4">
                                        {transcript && (
                                            <p className="text-white text-lg">{transcript}</p>
                                        )}
                                        {interimTranscript && (
                                            <p className="text-slate-400 italic">{interimTranscript}</p>
                                        )}
                                        {!transcript && !interimTranscript && isListening && (
                                            <p className="text-slate-500">Mów teraz...</p>
                                        )}
                                        {!isListening && !transcript && (
                                            <p className="text-slate-500">Kliknij mikrofon i powiedz np.<br />"Wydałem 50 zł w Żabce"</p>
                                        )}
                                    </div>

                                    {!isSupported && (
                                        <p className="text-amber-400 text-sm">
                                            ⚠️ Twoja przeglądarka nie obsługuje rozpoznawania mowy.
                                            Użyj Chrome lub Edge.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Processing State */}
                            {state === 'processing' && (
                                <div className="text-center py-12">
                                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400">AI analizuje Twoją komendę...</p>
                                    <p className="text-white mt-2">"{transcript}"</p>
                                </div>
                            )}

                            {/* Preview State */}
                            {state === 'preview' && parsedExpense && (
                                <div className="space-y-4">
                                    {/* Amount */}
                                    <div className="text-center py-4">
                                        <p className="text-4xl font-bold text-emerald-400">
                                            {formatAmountFromGrosze(parsedExpense.amount)}
                                        </p>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-3 bg-slate-800/50 rounded-2xl p-4">
                                        {/* Merchant */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Sklep</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">
                                                    {parsedExpense.merchant || 'Nieznany'}
                                                </span>
                                                <button
                                                    onClick={() => setEditingField('merchant')}
                                                    className="p-1 text-slate-500 hover:text-white"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Kategoria</span>
                                            <span className="text-white font-medium">
                                                {CATEGORY_LABELS[parsedExpense.category]}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Data</span>
                                            <span className="text-white">
                                                {parsedExpense.dateOffset === 0 ? 'Dziś' :
                                                    parsedExpense.dateOffset === -1 ? 'Wczoraj' :
                                                        getDateFromOffset(parsedExpense.dateOffset).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>

                                        {/* Items */}
                                        {parsedExpense.items.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Produkty</span>
                                                <span className="text-white">
                                                    {parsedExpense.items.join(', ')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Confidence */}
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Pewność AI</span>
                                            <span className={parsedExpense.confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}>
                                                {Math.round(parsedExpense.confidence * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            onClick={handleRetry}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Popraw
                                        </Button>
                                        <Button
                                            onClick={handleSaveExpense}
                                            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Dodaj
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Saving State */}
                            {state === 'saving' && (
                                <div className="text-center py-12">
                                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400">Zapisuję wydatek...</p>
                                </div>
                            )}

                            {/* Success State */}
                            {state === 'success' && (
                                <div className="text-center py-12">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <Check className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <p className="text-white text-xl font-semibold">Wydatek dodany!</p>
                                    <p className="text-slate-400 mt-2">Budżet zaktualizowany</p>
                                </div>
                            )}

                            {/* Error State */}
                            {state === 'error' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <p className="text-red-400 mb-4">{errorMessage}</p>
                                    <Button onClick={handleRetry}>
                                        Spróbuj ponownie
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
