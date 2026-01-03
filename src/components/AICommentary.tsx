'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2, Lock, Zap, TrendingDown, ShoppingBag, Target, Lightbulb } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui';

interface AICommentaryProps {
    categoryData: { category: string; name: string; amount: number }[];
    totalExpenses: number;
    avgDaily: number;
    period: string;
    merchantData: { name: string; amount: number }[];
}

// Quick insight chips for instant value
const QUICK_INSIGHTS = [
    { id: 'savings', label: 'Gdzie oszczędzić?', icon: TrendingDown, color: 'emerald' },
    { id: 'biggest', label: 'Największy wydatek', icon: ShoppingBag, color: 'rose' },
    { id: 'goal', label: 'Porady do celu', icon: Target, color: 'blue' },
];

export default function AICommentary({
    categoryData,
    totalExpenses,
    avgDaily,
    period,
    merchantData,
}: AICommentaryProps) {
    const { canUse, openUpgrade } = useSubscription();
    const hasAiAccess = canUse('aiInsights');
    const [commentary, setCommentary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeChip, setActiveChip] = useState<string | null>(null);

    const fetchCommentary = async (insightType?: string) => {
        if (categoryData.length === 0) {
            setCommentary('Dodaj wydatki, aby otrzymać analizę AI.');
            setLoading(false);
            return;
        }

        try {
            setRefreshing(true);
            if (insightType) setActiveChip(insightType);

            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chart_commentary',
                    data: {
                        chartType: insightType || 'spending_analysis',
                        currentData: {
                            total: totalExpenses / 100,
                            avgDaily: avgDaily / 100,
                            period,
                            topCategory: categoryData[0]?.name || 'brak',
                            topCategoryPercent: categoryData[0]
                                ? Math.round((categoryData[0].amount / totalExpenses) * 100)
                                : 0,
                            topMerchant: merchantData[0]?.name || 'brak',
                            topMerchantAmount: (merchantData[0]?.amount || 0) / 100,
                            categories: Object.fromEntries(
                                categoryData.slice(0, 5).map(c => [c.name, c.amount / 100])
                            ),
                        },
                    },
                }),
            });

            const result = await response.json();

            if (result.success && result.data) {
                setCommentary(typeof result.data === 'string' ? result.data : JSON.stringify(result.data));
            } else {
                setCommentary(generateFallbackCommentary());
            }
        } catch (error) {
            console.error('AI Commentary error:', error);
            setCommentary(generateFallbackCommentary());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateFallbackCommentary = (): string => {
        if (categoryData.length === 0) return 'Brak danych do analizy.';

        const topCategory = categoryData[0];
        const topPercent = Math.round((topCategory.amount / totalExpenses) * 100);

        let analysis = `📊 Twoja główna kategoria to **${topCategory.name}** (${topPercent}%). `;

        if (topPercent > 50) {
            analysis += `To ponad połowa wydatków! `;
        }

        if (merchantData[0]) {
            analysis += `Najczęściej: ${merchantData[0].name} (${formatMoney(merchantData[0].amount)}). `;
        }

        return analysis;
    };

    useEffect(() => {
        if (hasAiAccess) {
            fetchCommentary();
        } else {
            setLoading(false);
        }
    }, [categoryData, totalExpenses, period, hasAiAccess]);

    // Show upgrade CTA for free users
    if (!hasAiAccess) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 backdrop-blur-sm"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">AI Analityk</p>
                            <p className="text-sm text-slate-400">Spersonalizowane porady finansowe</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => openUpgrade('Odblokuj AI Analizę!')}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                    >
                        <Zap className="w-3 h-3 mr-1" />
                        Odblokuj
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-violet-950/50 via-indigo-950/40 to-slate-900/60 border border-violet-500/20 overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <motion.div
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                        animate={{ boxShadow: ['0 10px 15px -3px rgba(139, 92, 246, 0.3)', '0 10px 25px -3px rgba(139, 92, 246, 0.5)', '0 10px 15px -3px rgba(139, 92, 246, 0.3)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Sparkles className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                        <p className="font-semibold text-white">AI Analiza</p>
                        <p className="text-xs text-slate-400">Analizuję Twoje wydatki...</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchCommentary()}
                    disabled={refreshing}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Quick Insight Chips */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
                {QUICK_INSIGHTS.map((chip) => {
                    const Icon = chip.icon;
                    const isActive = activeChip === chip.id;
                    return (
                        <motion.button
                            key={chip.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fetchCommentary(chip.id)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${isActive
                                    ? `bg-${chip.color}-500/20 text-${chip.color}-300 border border-${chip.color}-500/30`
                                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <Icon className="w-3 h-3" />
                            {chip.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Commentary Content */}
            <div className="p-4">
                <AnimatePresence mode="wait">
                    {loading || refreshing ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                        >
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span className="text-sm text-slate-400">AI analizuje dane...</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-200 leading-relaxed">{commentary}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
