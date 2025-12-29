'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { formatMoney } from '@/lib/utils';

interface AICommentaryProps {
    categoryData: { category: string; name: string; amount: number }[];
    totalExpenses: number;
    avgDaily: number;
    period: string;
    merchantData: { name: string; amount: number }[];
}

export default function AICommentary({
    categoryData,
    totalExpenses,
    avgDaily,
    period,
    merchantData,
}: AICommentaryProps) {
    const [commentary, setCommentary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCommentary = async () => {
        if (categoryData.length === 0) {
            setCommentary('Dodaj wydatki, aby otrzymać analizę AI.');
            setLoading(false);
            return;
        }

        try {
            setRefreshing(true);

            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chart_commentary',
                    data: {
                        chartType: 'spending_analysis',
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
                // Fallback commentary
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

        let analysis = `📊 Twoja główna kategoria wydatków to ${topCategory.name} (${topPercent}% całości). `;

        if (topPercent > 50) {
            analysis += `To ponad połowa Twoich wydatków - rozważ optymalizację w tym obszarze. `;
        }

        if (merchantData[0]) {
            analysis += `Najczęściej kupujesz w ${merchantData[0].name} (${formatMoney(merchantData[0].amount)}). `;
        }

        if (avgDaily > 10000) { // 100 zł
            analysis += `Średnio dziennie wydajesz ${formatMoney(avgDaily)} - sprawdź czy to zgodne z Twoimi celami.`;
        } else {
            analysis += `Średni dzienny wydatek (${formatMoney(avgDaily)}) wygląda rozsądnie!`;
        }

        return analysis;
    };

    useEffect(() => {
        fetchCommentary();
    }, [categoryData, totalExpenses, period]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-purple-400 font-medium">AI Analiza</p>
                            {(loading || refreshing) && (
                                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                            )}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {loading ? 'AI analizuje Twoje wydatki...' : commentary}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchCommentary}
                    disabled={refreshing}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </motion.div>
    );
}
