'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Calendar, ChevronRight, Zap } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import Link from 'next/link';

interface BudgetPrediction {
    category: string;
    categoryLabel: string;
    currentSpent: number;
    limit: number;
    predictedTotal: number;
    daysUntilOverspend: number | null;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
}

interface PredictiveAlertsProps {
    predictions: BudgetPrediction[];
    monthlyPrediction?: {
        predicted: number;
        budget: number;
        daysRemaining: number;
        trend: 'up' | 'down' | 'stable';
    };
}

export default function PredictiveAlerts({ predictions, monthlyPrediction }: PredictiveAlertsProps) {
    // Filter only concerning predictions
    const concerningPredictions = predictions.filter(p =>
        p.daysUntilOverspend !== null && p.daysUntilOverspend <= 10
    );

    if (concerningPredictions.length === 0 && !monthlyPrediction) {
        return null;
    }

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border-amber-500/20">
            {/* Header */}
            <div className="p-4 border-b border-amber-500/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <h3 className="font-semibold flex items-center gap-2">
                        Alerty predykcyjne
                        {concerningPredictions.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                                {concerningPredictions.length}
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-slate-400">AI przewiduje Twoje wydatki</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Monthly prediction summary */}
                {monthlyPrediction && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-slate-800/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Prognoza na koniec miesiąca</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-bold ${monthlyPrediction.predicted > monthlyPrediction.budget
                                            ? 'text-red-400'
                                            : 'text-emerald-400'
                                        }`}>
                                        {formatMoney(monthlyPrediction.predicted)}
                                    </span>
                                    <span className="text-slate-500">
                                        / {formatMoney(monthlyPrediction.budget)}
                                    </span>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${monthlyPrediction.trend === 'up' ? 'text-red-400' :
                                    monthlyPrediction.trend === 'down' ? 'text-emerald-400' : 'text-slate-400'
                                }`}>
                                <TrendingUp className={`w-4 h-4 ${monthlyPrediction.trend === 'down' ? 'rotate-180' : ''}`} />
                                {monthlyPrediction.trend === 'up' ? 'Wzrost' :
                                    monthlyPrediction.trend === 'down' ? 'Spadek' : 'Stabilnie'}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Pozostało {monthlyPrediction.daysRemaining} dni do końca miesiąca
                        </p>
                    </motion.div>
                )}

                {/* Category alerts */}
                {concerningPredictions.map((prediction, index) => (
                    <motion.div
                        key={prediction.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prediction.daysUntilOverspend! <= 3
                                ? 'bg-red-500/20'
                                : 'bg-amber-500/20'
                            }`}>
                            <AlertTriangle className={`w-4 h-4 ${prediction.daysUntilOverspend! <= 3
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                                }`} />
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {prediction.categoryLabel}
                            </p>
                            <p className={`text-xs ${prediction.daysUntilOverspend! <= 3
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                                }`}>
                                Za ~{prediction.daysUntilOverspend} dni przekroczysz budżet
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-sm font-semibold">
                                {formatMoney(prediction.currentSpent)}
                            </p>
                            <p className="text-xs text-slate-500">
                                / {formatMoney(prediction.limit)}
                            </p>
                        </div>
                    </motion.div>
                ))}

                {/* Action link */}
                <Link
                    href="/budgets"
                    className="flex items-center justify-center gap-2 p-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                    Zarządzaj budżetami
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </Card>
    );
}

// Helper to calculate predictions from expenses and budgets
export function calculateBudgetPredictions(
    expenses: Array<{ amount: number; category: string; date: Date }>,
    budgets: Array<{ category: string; limit: number; categoryLabel: string }>
): BudgetPrediction[] {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return budgets.map(budget => {
        // Sum expenses for this category this month
        const monthlyExpenses = expenses.filter(e => {
            const expDate = new Date(e.date);
            return e.category === budget.category &&
                expDate.getMonth() === currentMonth &&
                expDate.getFullYear() === currentYear;
        });

        const currentSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Calculate daily average
        const dailyAverage = dayOfMonth > 0 ? currentSpent / dayOfMonth : 0;

        // Predict total by end of month
        const predictedTotal = currentSpent + (dailyAverage * daysRemaining);

        // Calculate days until overspend
        let daysUntilOverspend: number | null = null;
        if (dailyAverage > 0 && currentSpent < budget.limit) {
            const remainingBudget = budget.limit - currentSpent;
            daysUntilOverspend = Math.floor(remainingBudget / dailyAverage);
            if (daysUntilOverspend > daysRemaining) {
                daysUntilOverspend = null; // Won't overspend this month
            }
        } else if (currentSpent >= budget.limit) {
            daysUntilOverspend = 0; // Already overspent
        }

        // Determine trend
        const trend: 'up' | 'down' | 'stable' =
            predictedTotal > budget.limit * 1.1 ? 'up' :
                predictedTotal < budget.limit * 0.9 ? 'down' : 'stable';

        return {
            category: budget.category,
            categoryLabel: budget.categoryLabel,
            currentSpent,
            limit: budget.limit,
            predictedTotal,
            daysUntilOverspend,
            confidence: 0.7 + (dayOfMonth / daysInMonth * 0.3), // More accurate as month progresses
            trend,
        };
    });
}
