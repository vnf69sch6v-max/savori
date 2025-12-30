'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Info, X, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import { AnomalyResult, getSeverityColor } from '@/lib/anomaly-detector';

interface AnomalyAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    anomaly: AnomalyResult;
    expense: {
        merchant: string;
        amount: number;
    };
}

const severityIcons = {
    high: ShieldAlert,
    medium: AlertTriangle,
    low: Info,
};

export default function AnomalyAlertModal({
    isOpen,
    onClose,
    onConfirm,
    anomaly,
    expense,
}: AnomalyAlertModalProps) {
    if (!isOpen) return null;

    const Icon = severityIcons[anomaly.severity];
    const colorClass = getSeverityColor(anomaly.severity);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-md bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden ${colorClass}`}
                >
                    {/* Header */}
                    <div className={`p-6 text-center ${colorClass}`}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClass}`}
                        >
                            <Icon className="w-8 h-8" />
                        </motion.div>
                        <h3 className="text-xl font-semibold mb-1">
                            {anomaly.severity === 'high' ? '🚨 Uwaga!' : anomaly.severity === 'medium' ? '⚠️ Nietypowy wydatek' : 'ℹ️ Informacja'}
                        </h3>
                        <p className="text-slate-400">
                            {expense.merchant} • <span className="font-semibold text-white">{formatMoney(expense.amount)}</span>
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Reason */}
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <p className="text-sm text-slate-300">{anomaly.reason}</p>
                        </div>

                        {/* Comparison */}
                        {anomaly.comparison && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-800/50 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Ten wydatek</p>
                                    <p className="text-lg font-bold text-white">
                                        {formatMoney(anomaly.comparison.current)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-800/50 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Twoja średnia</p>
                                    <p className="text-lg font-bold text-slate-400">
                                        {formatMoney(anomaly.comparison.average)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Multiplier badge */}
                        {anomaly.comparison && (
                            <div className="flex justify-center">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${colorClass}`}>
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {anomaly.comparison.multiplier.toFixed(1)}× wyższy od średniej
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Question */}
                        <p className="text-center text-sm text-slate-400">
                            Czy chcesz kontynuować zapisywanie tego wydatku?
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-slate-800 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Anuluj
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={onConfirm}
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Zapisz mimo to
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
