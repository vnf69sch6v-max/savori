'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, Loader2, AlertCircle, Keyboard, Send, Sparkles, Crown, Zap } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/lib/expense-service';
import { formatAmountFromGrosze, getDateFromOffset } from '@/lib/ai/voice-expense-parser';
import type { ParsedVoiceExpense } from '@/lib/ai/voice-expense-parser';
import type { ExpenseCategory } from '@/types';
import { toast } from 'react-hot-toast';
import { subscriptionService } from '@/lib/subscription-service';
import Link from 'next/link';

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

type ModalState = 'idle' | 'recording' | 'processing' | 'preview' | 'saving' | 'success' | 'error' | 'text-input';

export default function VoiceExpenseModal({ isOpen, onClose }: VoiceExpenseModalProps) {
    const router = useRouter();
    const { userData } = useAuth();
    const [state, setState] = useState<ModalState>('idle');
    const [parsedExpense, setParsedExpense] = useState<ParsedVoiceExpense | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [transcript, setTranscript] = useState('');
    const [savedAmount, setSavedAmount] = useState(0);

    const {
        isRecording,
        audioBlob,
        duration,
        error: recordingError,
        startRecording,
        stopRecording,
        resetRecording,
    } = useAudioRecorder();

    // Usage tracking
    const remainingMessages = subscriptionService.getRemainingAiMessages(
        userData?.subscription,
        userData?.usage
    );
    const dailyLimit = subscriptionService.getLimit(userData?.subscription, 'dailyAiMessages');
    const isUnlimited = dailyLimit === Infinity;
    const planName = userData?.subscription?.plan || 'free';

    // Reset when modal opens
    useEffect(() => {
        if (isOpen && state === 'idle') {
            resetRecording();
            setTranscript('');
            setParsedExpense(null);
            setErrorMessage(null);
        }
    }, [isOpen]);

    // Handle recording errors
    useEffect(() => {
        if (recordingError) {
            setErrorMessage(recordingError);
            setState('error');
        }
    }, [recordingError]);

    // Process audio when recording stops
    useEffect(() => {
        if (audioBlob && !isRecording && state === 'recording') {
            processAudio(audioBlob);
        }
    }, [audioBlob, isRecording, state]);

    const handleStartRecording = async () => {
        if (remainingMessages <= 0 && !isUnlimited) {
            setErrorMessage('Wykorzystałeś dzisiejszy limit wiadomości AI');
            setState('error');
            return;
        }
        setErrorMessage(null);
        setParsedExpense(null);
        setTranscript('');
        setState('recording');
        await startRecording();
    };

    const handleStopRecording = () => {
        stopRecording();
    };

    const handleTextSubmit = async () => {
        if (textInput.trim().length > 3) {
            if (remainingMessages <= 0 && !isUnlimited) {
                setErrorMessage('Wykorzystałeś dzisiejszy limit wiadomości AI');
                setState('error');
                return;
            }
            setState('processing');
            try {
                const response = await fetch('/api/parse-voice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript: textInput.trim() }),
                });
                const result = await response.json();
                if (result.success && result.data) {
                    setParsedExpense(result.data);
                    setTranscript(textInput.trim());
                    setState('preview');
                } else {
                    setErrorMessage(result.error || 'Nie udało się rozpoznać wydatku');
                    setState('error');
                }
            } catch {
                setErrorMessage('Błąd połączenia.');
                setState('error');
            }
        }
    };

    const processAudio = async (blob: Blob) => {
        setState('processing');

        try {
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');

            const response = await fetch('/api/parse-audio', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success && result.data) {
                setParsedExpense(result.data);
                setTranscript(result.transcript || '');
                setState('preview');
            } else {
                setErrorMessage(result.error || 'Nie udało się rozpoznać wydatku');
                setTranscript(result.transcript || '');
                setState('error');
            }
        } catch (error) {
            console.error('Process error:', error);
            setErrorMessage('Błąd połączenia. Spróbuj ponownie.');
            setState('error');
        }
    };

    const handleSaveExpense = async () => {
        if (!parsedExpense || !userData?.id) {
            setErrorMessage('Brak danych użytkownika. Zaloguj się ponownie.');
            setState('error');
            return;
        }

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
                ...(parsedExpense.items.length > 0 && {
                    notes: `Produkty: ${parsedExpense.items.join(', ')}`
                }),
            });

            setState('success');
            setSavedAmount(parsedExpense.amount);
            toast.success('Wydatek dodany! 🎉');

            setTimeout(() => {
                handleClose();
                router.push('/expenses');
            }, 1800);
        } catch (error) {
            console.error('Save error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Nieznany błąd';
            setErrorMessage(`Nie udało się zapisać: ${errorMsg}`);
            setState('error');
        }
    };

    const handleClose = () => {
        stopRecording();
        resetRecording();
        setState('idle');
        setParsedExpense(null);
        setErrorMessage(null);
        setTextInput('');
        setTranscript('');
        onClose();
    };

    const handleRetry = () => {
        resetRecording();
        setTextInput('');
        setTranscript('');
        setParsedExpense(null);
        setErrorMessage(null);
        setState('idle');
    };

    const switchToTextInput = () => {
        stopRecording();
        setState('text-input');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                onClick={handleClose}
            >
                {/* Backdrop with gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/80 to-black/60 backdrop-blur-md" />

                <motion.div
                    initial={{ scale: 0.95, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 50, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md mx-4 mb-4 sm:mb-0"
                >
                    <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/98 backdrop-blur-2xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10">
                        {/* Header with gradient accent */}
                        <div className="relative px-5 pt-5 pb-4">
                            {/* Gradient glow behind header */}
                            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">
                                            {state === 'idle' && 'Asystent AI'}
                                            {state === 'recording' && 'Nagrywam...'}
                                            {state === 'processing' && 'Analizuję...'}
                                            {state === 'preview' && 'Rozpoznano'}
                                            {state === 'saving' && 'Zapisuję...'}
                                            {state === 'success' && 'Dodano!'}
                                            {state === 'error' && 'Błąd'}
                                            {state === 'text-input' && 'Wpisz wydatek'}
                                        </h2>

                                        {/* Usage counter for non-unlimited plans */}
                                        {(state === 'idle' || state === 'text-input') && !isUnlimited && (
                                            <p className="text-xs text-slate-400">
                                                {remainingMessages > 0 ? (
                                                    <span>
                                                        <span className="text-emerald-400 font-medium">{remainingMessages}</span>
                                                        /{dailyLimit} dziś
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-400">Limit wyczerpany</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700/50 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-5 pb-6">
                            {/* Idle & Recording State */}
                            {(state === 'idle' || state === 'recording') && (
                                <div className="text-center py-6">
                                    {/* Microphone Button with premium styling */}
                                    <div className="relative inline-block mb-6">
                                        {/* Outer ring animation when recording */}
                                        {isRecording && (
                                            <>
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-full bg-emerald-500"
                                                    style={{ margin: '-12px' }}
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                                                    className="absolute inset-0 rounded-full bg-emerald-400"
                                                    style={{ margin: '-24px' }}
                                                />
                                            </>
                                        )}

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                                            disabled={remainingMessages <= 0 && !isUnlimited}
                                            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all
                                                ${isRecording
                                                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/40'
                                                    : remainingMessages <= 0 && !isUnlimited
                                                        ? 'bg-slate-800 border border-slate-700 cursor-not-allowed'
                                                        : 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20'
                                                }`}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isRecording ? (
                                                    <motion.div
                                                        key="wave"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center gap-1 h-12"
                                                    >
                                                        {[...Array(5)].map((_, i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{
                                                                    height: [16, Math.random() * 32 + 16, 16],
                                                                }}
                                                                transition={{
                                                                    duration: 0.5,
                                                                    repeat: Infinity,
                                                                    delay: i * 0.1,
                                                                    repeatType: "reverse"
                                                                }}
                                                                className="w-1.5 rounded-full bg-white"
                                                            />
                                                        ))}
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="mic"
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.5, opacity: 0 }}
                                                    >
                                                        <Mic className={`w-10 h-10 ${remainingMessages <= 0 && !isUnlimited ? 'text-slate-600' : 'text-purple-400'}`} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </div>

                                    {/* Status Text & Timer */}
                                    <div className="min-h-[60px] mb-4">
                                        {isRecording ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-2"
                                            >
                                                <p className="text-emerald-400 font-medium tracking-wide uppercase text-xs">Słucham...</p>
                                                <p className="text-white text-3xl font-light font-mono">
                                                    {Math.floor(duration / 60).toString().padStart(2, '0')}:
                                                    {(duration % 60).toString().padStart(2, '0')}
                                                </p>
                                            </motion.div>
                                        ) : remainingMessages <= 0 && !isUnlimited ? (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                                <p className="text-amber-400 text-sm">Dzienny limit wyczerpany</p>
                                                <Link href="/settings/billing">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium flex items-center gap-2 mx-auto"
                                                    >
                                                        <Crown className="w-4 h-4" />
                                                        Ulepsz plan
                                                    </motion.button>
                                                </Link>
                                            </motion.div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                                                <p className="text-slate-400 text-sm">Dotknij, aby rozmawiać</p>
                                                <p className="text-slate-300 font-medium">"50 zł w Żabce na zakupy"</p>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Switch to text */}
                                    {!isRecording && (remainingMessages > 0 || isUnlimited) && (
                                        <button
                                            onClick={switchToTextInput}
                                            className="text-slate-500 hover:text-purple-400 text-xs flex items-center justify-center gap-2 mx-auto transition-colors"
                                        >
                                            <Keyboard className="w-3.5 h-3.5" />
                                            Wpisz ręcznie
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Text Input Mode */}
                            {state === 'text-input' && (
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm text-center">
                                        Wpisz wydatek naturalnym językiem
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                                            placeholder="50 zł w Żabce..."
                                            autoFocus
                                            className="w-full h-14 px-4 pr-14 bg-slate-800/80 border border-slate-600/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all text-lg"
                                        />
                                        <button
                                            onClick={handleTextSubmit}
                                            disabled={textInput.trim().length < 4}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {['50 zł zakupy', '15 zł kawa', '200 zł paliwo'].map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setTextInput(example)}
                                                className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-xs text-slate-400 hover:text-white hover:border-purple-500/50 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleRetry}
                                        className="w-full py-3 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Mic className="w-4 h-4" />
                                        Użyj głosu
                                    </button>
                                </div>
                            )}

                            {/* Processing State */}
                            {state === 'processing' && (
                                <div className="text-center py-12">
                                    <div className="relative inline-block">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="w-16 h-16 rounded-full border-2 border-purple-500/30 border-t-purple-500"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Zap className="w-6 h-6 text-purple-400" />
                                        </div>
                                    </div>
                                    <p className="text-slate-400 mt-4">AI analizuje...</p>
                                </div>
                            )}

                            {/* Preview State */}
                            {state === 'preview' && parsedExpense && (
                                <div className="space-y-4">
                                    {transcript && (
                                        <p className="text-center text-slate-400 text-sm italic">"{transcript}"</p>
                                    )}

                                    <div className="text-center py-4">
                                        <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                            {formatAmountFromGrosze(parsedExpense.amount)}
                                        </p>
                                    </div>

                                    <div className="space-y-2 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-slate-400 text-sm">Sklep</span>
                                            <span className="text-white font-medium">{parsedExpense.merchant || 'Nieznany'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-t border-slate-700/50">
                                            <span className="text-slate-400 text-sm">Kategoria</span>
                                            <span className="text-white font-medium">{CATEGORY_LABELS[parsedExpense.category]}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-t border-slate-700/50">
                                            <span className="text-slate-400 text-sm">Data</span>
                                            <span className="text-white">
                                                {parsedExpense.dateOffset === 0 ? 'Dziś' :
                                                    parsedExpense.dateOffset === -1 ? 'Wczoraj' :
                                                        getDateFromOffset(parsedExpense.dateOffset).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button onClick={handleRetry} variant="outline" className="flex-1 border-slate-700">
                                            Popraw
                                        </Button>
                                        <Button onClick={handleSaveExpense} className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 border-0 hover:opacity-90">
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
                                <div className="text-center py-8 relative overflow-hidden">
                                    {[...Array(15)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ y: -20, x: Math.random() * 200 - 100, opacity: 1 }}
                                            animate={{ y: 200, opacity: 0 }}
                                            transition={{ duration: 1.5, delay: Math.random() * 0.3 }}
                                            className={`absolute w-2 h-2 rounded-sm ${['bg-emerald-400', 'bg-cyan-400', 'bg-purple-400'][i % 3]}`}
                                            style={{ left: `${Math.random() * 100}%` }}
                                        />
                                    ))}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30"
                                    >
                                        <Check className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <p className="text-emerald-400 text-3xl font-bold mb-1">{formatAmountFromGrosze(savedAmount)}</p>
                                    <p className="text-white text-lg font-semibold">Wydatek dodany!</p>
                                </div>
                            )}

                            {/* Error State */}
                            {state === 'error' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-400" />
                                    </div>
                                    <p className="text-red-400 mb-2">{errorMessage}</p>
                                    {remainingMessages <= 0 && !isUnlimited ? (
                                        <Link href="/settings/billing">
                                            <Button className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 border-0">
                                                <Crown className="w-4 h-4 mr-2" />
                                                Ulepsz plan
                                            </Button>
                                        </Link>
                                    ) : (
                                        <div className="flex gap-3 justify-center">
                                            <Button onClick={handleRetry}>
                                                <Mic className="w-4 h-4 mr-2" />
                                                Spróbuj ponownie
                                            </Button>
                                            <Button onClick={switchToTextInput} variant="outline">
                                                <Keyboard className="w-4 h-4 mr-2" />
                                                Wpisz
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
