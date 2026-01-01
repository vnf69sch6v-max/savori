'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, Loader2, AlertCircle, Keyboard, Send } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
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

type ModalState = 'idle' | 'recording' | 'processing' | 'preview' | 'saving' | 'success' | 'error' | 'text-input';

export default function VoiceExpenseModal({ isOpen, onClose }: VoiceExpenseModalProps) {
    const { userData } = useAuth();
    const [state, setState] = useState<ModalState>('idle');
    const [parsedExpense, setParsedExpense] = useState<ParsedVoiceExpense | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [transcript, setTranscript] = useState('');

    const {
        isRecording,
        audioBlob,
        duration,
        error: recordingError,
        startRecording,
        stopRecording,
        resetRecording,
    } = useAudioRecorder();

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

            console.log('Saving expense:', {
                userId: userData.id,
                amount: parsedExpense.amount,
                merchant: parsedExpense.merchant,
                category: parsedExpense.category,
            });

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
            toast.success('Wydatek dodany! 🎉');

            setTimeout(() => {
                handleClose();
            }, 1500);
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
                                {state === 'idle' && '🎤 Dodaj wydatek'}
                                {state === 'recording' && '🔴 Nagrywam...'}
                                {state === 'processing' && '🤔 Analizuję...'}
                                {state === 'preview' && '✨ Rozpoznany wydatek'}
                                {state === 'saving' && '💾 Zapisuję...'}
                                {state === 'success' && '✅ Dodano!'}
                                {state === 'error' && '❌ Błąd'}
                                {state === 'text-input' && '⌨️ Wpisz wydatek'}
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
                            {/* Idle & Recording State */}
                            {(state === 'idle' || state === 'recording') && (
                                <div className="text-center py-8">
                                    {/* Microphone Button */}
                                    <div className="relative inline-block mb-6">
                                        {isRecording && (
                                            <>
                                                <motion.div
                                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="absolute inset-0 rounded-full bg-red-500/30"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                                    className="absolute inset-0 rounded-full bg-red-500/20"
                                                />
                                            </>
                                        )}

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                                                ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/40'
                                                : 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60'
                                                }`}
                                        >
                                            {isRecording ? (
                                                <MicOff className="w-10 h-10 text-white" />
                                            ) : (
                                                <Mic className="w-10 h-10 text-white" />
                                            )}
                                        </motion.button>
                                    </div>

                                    {/* Status */}
                                    <div className="min-h-[60px] mb-4">
                                        {isRecording ? (
                                            <div>
                                                <p className="text-white text-lg font-medium">Mów teraz...</p>
                                                <p className="text-red-400 text-2xl font-mono mt-2">
                                                    {Math.floor(duration / 60).toString().padStart(2, '0')}:
                                                    {(duration % 60).toString().padStart(2, '0')}
                                                </p>
                                                <p className="text-slate-500 text-sm mt-2">Kliknij ponownie aby zakończyć</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-slate-400">Naciśnij i powiedz np.</p>
                                                <p className="text-white mt-1">"Wydałem 50 zł w Żabce"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Switch to text */}
                                    {!isRecording && (
                                        <button
                                            onClick={switchToTextInput}
                                            className="text-slate-500 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                                        >
                                            <Keyboard className="w-4 h-4" />
                                            Wpisz ręcznie
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Text Input Mode */}
                            {state === 'text-input' && (
                                <div className="space-y-4">
                                    <p className="text-slate-400 text-sm text-center mb-4">
                                        Wpisz wydatek, np. "50 zł w Żabce na zakupy"
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                                            placeholder="Wydałem 50 zł w Żabce..."
                                            autoFocus
                                            className="w-full h-14 px-4 pr-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all text-lg"
                                        />
                                        <button
                                            onClick={handleTextSubmit}
                                            disabled={textInput.trim().length < 4}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {['50 zł zakupy', '15 zł kawa', '200 zł paliwo'].map((example) => (
                                            <button
                                                key={example}
                                                onClick={() => setTextInput(example)}
                                                className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleRetry}
                                        className="w-full mt-4 py-3 text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Mic className="w-4 h-4" />
                                        Użyj głosu
                                    </button>
                                </div>
                            )}

                            {/* Processing State */}
                            {state === 'processing' && (
                                <div className="text-center py-12">
                                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400">AI analizuje nagranie...</p>
                                </div>
                            )}

                            {/* Preview State */}
                            {state === 'preview' && parsedExpense && (
                                <div className="space-y-4">
                                    {transcript && (
                                        <p className="text-center text-slate-400 text-sm italic mb-2">
                                            "{transcript}"
                                        </p>
                                    )}

                                    <div className="text-center py-4">
                                        <p className="text-4xl font-bold text-emerald-400">
                                            {formatAmountFromGrosze(parsedExpense.amount)}
                                        </p>
                                    </div>

                                    <div className="space-y-3 bg-slate-800/50 rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Sklep</span>
                                            <span className="text-white font-medium">
                                                {parsedExpense.merchant || 'Nieznany'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Kategoria</span>
                                            <span className="text-white font-medium">
                                                {CATEGORY_LABELS[parsedExpense.category]}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Data</span>
                                            <span className="text-white">
                                                {parsedExpense.dateOffset === 0 ? 'Dziś' :
                                                    parsedExpense.dateOffset === -1 ? 'Wczoraj' :
                                                        getDateFromOffset(parsedExpense.dateOffset).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>

                                        {parsedExpense.items.length > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-400">Produkty</span>
                                                <span className="text-white">
                                                    {parsedExpense.items.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

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
                                    <p className="text-red-400 mb-2">{errorMessage}</p>
                                    {transcript && (
                                        <p className="text-slate-500 text-sm mb-4">Usłyszałem: "{transcript}"</p>
                                    )}
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
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
