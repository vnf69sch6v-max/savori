'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import { impulseService } from '@/lib/impulse-service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface ImpulseLockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImpulseLockModal({ isOpen, onClose }: ImpulseLockModalProps) {
    const { userData } = useAuth();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState<number>(24); // hours
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!userData?.id || !amount) return;

        const amountValue = parseFloat(amount.replace(',', '.'));
        if (isNaN(amountValue) || amountValue <= 0) {
            toast.error('Wpisz poprawną kwotę');
            return;
        }

        setLoading(true);
        try {
            await impulseService.createLock(
                userData.id,
                Math.round(amountValue * 100), // to grosz
                duration,
                reason
            );

            toast.success(
                <div className="flex flex-col">
                    <span className="font-bold">Impuls zablokowany! 🛡️</span>
                    <span className="text-sm">Środki bezpieczne na {duration}h</span>
                </div>
            );

            setAmount('');
            setReason('');
            onClose();
        } catch (error) {
            console.error('Lock error:', error);
            toast.error('Błąd blokady');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-4 right-4 top-[20%] md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 z-50 shadow-2xl shadow-amber-900/20"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 ring-1 ring-amber-500/30">
                                <ShieldAlert className="w-8 h-8 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-center">Zatrzymaj Impuls</h2>
                            <p className="text-slate-400 text-sm text-center">Poczekaj zanim kupisz. Zablokuj środki.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Ile chcesz wydać?</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-800 border-none rounded-xl py-3 pl-4 pr-12 text-lg font-bold text-white focus:ring-2 focus:ring-amber-500"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">PLN</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Na co? (Opcjonalnie)</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="np. Nowe buty"
                                    className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Czas blokady</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[24, 48, 168].map((h) => (
                                        <button
                                            key={h}
                                            onClick={() => setDuration(h)}
                                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${duration === h
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                    : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {h === 168 ? '1 Tydzień' : `${h}h`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !amount}
                                className="w-full py-6 mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-lg shadow-lg shadow-amber-500/20"
                            >
                                {loading ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Zablokuj Impuls
                                    </div>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
