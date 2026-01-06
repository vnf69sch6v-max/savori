'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, RefreshCw, Target, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney as formatMoneyBase, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/utils';
import { predictMonthlySpending, SpendingPrediction, getPredictionStatus } from '@/lib/spending-predictor';
import { useCurrency } from '@/hooks/use-language';
import ProLockedFeature from './ProLockedFeature';

interface PredictiveSpendingWidgetProps {
    lastUpdate?: number;
    onPriorityChange?: (priority: 'critical' | 'high' | 'medium' | 'low') => void;
}

export default function PredictiveSpendingWidget({ lastUpdate, onPriorityChange }: PredictiveSpendingWidgetProps) {
    const { userData } = useAuth();
    const { format: formatMoney } = useCurrency();
    const [prediction, setPrediction] = useState<SpendingPrediction | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Check Pro subscription
    const isPro = userData?.subscription?.plan === 'pro' || userData?.subscription?.plan === 'ultra';

    // If not Pro, show locked state
    if (!isPro) {
        return (
            <ProLockedFeature
                title="Prognoza wydatków"
                description="Dostępna w planie Pro"
                icon={<Target className="w-6 h-6 text-amber-400" />}
            />
        );
    }

    const fetchPrediction = useCallback(async () => {
        if (!userData?.id) return;

        try {
            setRefreshing(true);
            const data = await predictMonthlySpending(userData.id);
            setPrediction(data);
        } catch (error) {
            console.error('Prediction error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userData?.id]);

    useEffect(() => {
        fetchPrediction();
    }, [fetchPrediction, lastUpdate]);

    useEffect(() => {
        if (!onPriorityChange || !prediction) return;

        const status = getPredictionStatus(prediction);
        if (status.status === 'danger') {
            onPriorityChange('critical');
        } else if (status.status === 'warning') {
            onPriorityChange('high');
        } else {
            onPriorityChange('low');
        }
    }, [prediction, onPriorityChange]);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                        <span className="ml-3 text-slate-400">Obliczanie prognozy...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!prediction) {
        return null;
    }

    const status = getPredictionStatus(prediction);
    const progressPercent = prediction.budgetLimit
        ? Math.min(100, (prediction.currentSpent / prediction.budgetLimit) * 100)
        : 0;
    const predictedPercent = prediction.budgetLimit
        ? Math.min(120, (prediction.predictedTotal / prediction.budgetLimit) * 100)
        : 0;

    return (
        <Card className="overflow-hidden w-full max-w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Prognoza</CardTitle>
                        <p className="text-xs text-slate-500">{prediction.daysRemaining} dni do końca miesiąca</p>
                    </div>
                </div>
                <button
                    onClick={fetchPrediction}
                    disabled={refreshing}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </CardHeader>

            <CardContent className="space-y-3 p-3 pt-0">
                {/* Progress bars */}
                <div className="space-y-2">
                    {/* Current spent */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Wydane</span>
                        <span className="font-medium">{formatMoney(prediction.currentSpent)}</span>
                    </div>

                    {/* Budget visualization */}
                    {prediction.budgetLimit && (
                        <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden">
                            {/* Current spent bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                            />

                            {/* Predicted total indicator */}
                            <motion.div
                                initial={{ left: 0 }}
                                animate={{ left: `${Math.min(predictedPercent, 100)}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                                style={{ transform: 'translateX(-50%)' }}
                            />

                            {/* Budget limit line */}
                            <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-slate-500" />

                            {/* Percentage text */}
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                {progressPercent.toFixed(0)}%
                            </span>
                        </div>
                    )}

                    {/* Predicted line */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-400 rounded-full" />
                            Prognoza
                        </span>
                        <span className={`font-medium ${status.color}`}>
                            {formatMoney(prediction.predictedTotal)}
                        </span>
                    </div>

                    {prediction.budgetLimit && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Budżet</span>
                            <span className="font-medium text-slate-300">
                                {formatMoney(prediction.budgetLimit)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status alert */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl border ${status.status === 'danger'
                        ? 'bg-red-500/10 border-red-500/30'
                        : status.status === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-emerald-500/10 border-emerald-500/30'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {status.status === 'danger' ? (
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : status.status === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className={`text-sm ${status.color}`}>{status.message}</span>
                    </div>
                </motion.div>

                {/* Daily recommendation */}
                {prediction.budgetLimit && prediction.daysRemaining > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Dzienny limit</span>
                        </div>
                        <span className={`text-sm font-medium ${prediction.predictedDailyBudget > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {prediction.predictedDailyBudget > 0
                                ? formatMoney(prediction.predictedDailyBudget)
                                : 'Przekroczono!'
                            }
                        </span>
                    </div>
                )}

                {/* Category breakdown */}
                {prediction.breakdown.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Top kategorie</p>
                        {prediction.breakdown.slice(0, 3).map((cat, i) => (
                            <div key={cat.category} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span>{CATEGORY_ICONS[cat.category] || '📦'}</span>
                                    <span className="text-slate-300">
                                        {CATEGORY_LABELS[cat.category] || cat.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">{formatMoney(cat.spent)}</span>
                                    {cat.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                                    {cat.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Confidence */}
                <div className="flex items-center justify-center gap-2 pt-2">
                    <span className="text-xs text-slate-500">
                        Pewność prognozy: {prediction.confidence.toFixed(0)}%
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
