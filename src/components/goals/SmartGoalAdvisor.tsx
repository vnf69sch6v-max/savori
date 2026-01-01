'use client';

import { motion } from 'framer-motion';
import {
    Sparkles,
    TrendingUp,
    Calendar,
    Lightbulb,
    ChevronRight,
    PiggyBank,
    Target,
    Zap
} from 'lucide-react';
import { Card } from '@/components/ui';
import { formatMoney, CATEGORY_LABELS } from '@/lib/utils';
import { SavingGoal, Expense } from '@/types';

interface GoalInsight {
    type: 'savings_tip' | 'prediction' | 'acceleration';
    title: string;
    description: string;
    emoji: string;
    impact?: number; // potential savings in grosze
    category?: string;
    action?: string;
}

interface SmartGoalAdvisorProps {
    goal: SavingGoal;
    expenses: Expense[];
    monthlyIncome?: number;
}

export default function SmartGoalAdvisor({ goal, expenses, monthlyIncome = 500000 }: SmartGoalAdvisorProps) {
    // Calculate spending patterns
    const spendingByCategory = expenses.reduce((acc, exp) => {
        const cat = exp.merchant?.category || 'other';
        acc[cat] = (acc[cat] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    // Find the biggest spending categories
    const sortedCategories = Object.entries(spendingByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Calculate current savings rate
    const totalMonthlyExpenses = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);
    const currentMonthlySavings = Math.max(0, monthlyIncome - totalMonthlyExpenses);

    // Remaining amount to save
    const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));

    // Predicted months to goal at current rate
    const monthsToGoal = currentMonthlySavings > 0
        ? Math.ceil(remaining / currentMonthlySavings)
        : Infinity;

    // Predicted completion date
    const predictedDate = new Date();
    if (monthsToGoal !== Infinity) {
        predictedDate.setMonth(predictedDate.getMonth() + monthsToGoal);
    }

    // Generate insights
    const insights: GoalInsight[] = [];

    // Insight 1: Prediction
    if (monthsToGoal !== Infinity && monthsToGoal > 0) {
        insights.push({
            type: 'prediction',
            title: `Osiągniesz cel za ~${monthsToGoal} msc`,
            description: `Przy obecnym tempie oszczędzania (${formatMoney(currentMonthlySavings)}/msc)`,
            emoji: '📅',
        });
    } else if (remaining <= 0) {
        insights.push({
            type: 'prediction',
            title: 'Cel osiągnięty! 🎉',
            description: 'Gratulacje!',
            emoji: '🏆',
        });
    } else {
        insights.push({
            type: 'prediction',
            title: 'Brak oszczędności',
            description: 'Wydajesz więcej niż zarabiasz - ustaw budżet!',
            emoji: '⚠️',
        });
    }

    // Insight 2: Biggest spending category tip
    if (sortedCategories.length > 0) {
        const [topCat, topAmount] = sortedCategories[0];
        const potentialSavings = Math.round(topAmount * 0.2); // Suggest 20% reduction

        if (potentialSavings > 5000) { // Only show if savings > 50 zł
            const monthsAcceleration = potentialSavings > 0 && currentMonthlySavings > 0
                ? Math.floor((remaining / (currentMonthlySavings + potentialSavings)) - monthsToGoal)
                : 0;

            insights.push({
                type: 'savings_tip',
                title: `Zmniejsz wydatki na ${CATEGORY_LABELS[topCat] || topCat}`,
                description: `Wydajesz ${formatMoney(topAmount)}/msc. Zmniejsz o 20% = +${formatMoney(potentialSavings)}/msc`,
                emoji: '💡',
                impact: potentialSavings,
                category: topCat,
                action: monthsAcceleration < 0 ? `Cel szybciej o ${Math.abs(monthsAcceleration)} msc!` : undefined,
            });
        }
    }

    // Insight 3: Restaurant/entertainment specific tip
    const entertainmentSpend = (spendingByCategory['restaurants'] || 0) + (spendingByCategory['entertainment'] || 0);
    if (entertainmentSpend > 20000) { // > 200 zł
        const potentialSavings = Math.round(entertainmentSpend * 0.3);
        insights.push({
            type: 'acceleration',
            title: 'Ogranicz rozrywkę = szybszy cel',
            description: `Restauracje + rozrywka: ${formatMoney(entertainmentSpend)}/msc. Oszczędź ${formatMoney(potentialSavings)}!`,
            emoji: '🍕',
            impact: potentialSavings,
        });
    }

    // Insight 4: Subscription check
    const subscriptionSpend = spendingByCategory['subscriptions'] || 0;
    if (subscriptionSpend > 10000) { // > 100 zł
        insights.push({
            type: 'savings_tip',
            title: 'Sprawdź subskrypcje',
            description: `Płacisz ${formatMoney(subscriptionSpend)}/msc na subskrypcje. Może któraś jest zbędna?`,
            emoji: '📺',
            impact: Math.round(subscriptionSpend * 0.25),
        });
    }

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 border-purple-500/20">
            {/* Header */}
            <div className="p-4 border-b border-purple-500/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold">AI Doradca Celów</h3>
                    <p className="text-xs text-slate-400">Jak szybciej osiągnąć "{goal.name}"</p>
                </div>
            </div>

            {/* Insights */}
            <div className="p-4 space-y-3">
                {insights.map((insight, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                        <span className="text-2xl">{insight.emoji}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{insight.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{insight.description}</p>
                            {insight.action && (
                                <p className="text-xs text-emerald-400 mt-1 font-medium">
                                    {insight.action}
                                </p>
                            )}
                        </div>
                        {insight.impact && (
                            <div className="text-right shrink-0">
                                <p className="text-emerald-400 text-sm font-bold">
                                    +{formatMoney(insight.impact)}
                                </p>
                                <p className="text-[10px] text-slate-500">/msc</p>
                            </div>
                        )}
                    </motion.div>
                ))}

                {/* Progress prediction bar */}
                <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Prognozowany postęp</span>
                        <span className="text-xs text-purple-400 font-medium">
                            {monthsToGoal !== Infinity ? `${monthsToGoal} msc` : '∞'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, ((goal.currentAmount || 0) / goal.targetAmount) * 100)}%` }}
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            />
                        </div>
                        <Target className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                        <span>Teraz: {formatMoney(goal.currentAmount || 0)}</span>
                        <span>Cel: {formatMoney(goal.targetAmount)}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// Helper to calculate goal insights from expense data
export function calculateGoalAcceleration(
    goal: SavingGoal,
    expenses: Expense[],
    suggestedMonthlySavings: number
): { monthsToGoal: number; monthsSaved: number } {
    const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentSavings = 500000 - totalExpenses; // Assuming 5000 zł monthly income

    const currentMonths = currentSavings > 0 ? Math.ceil(remaining / currentSavings) : Infinity;
    const newMonths = (currentSavings + suggestedMonthlySavings) > 0
        ? Math.ceil(remaining / (currentSavings + suggestedMonthlySavings))
        : Infinity;

    return {
        monthsToGoal: newMonths,
        monthsSaved: currentMonths - newMonths,
    };
}
