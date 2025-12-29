'use client';

import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    RefreshCw,
    Target,
    Flame,
    X,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui';
import { AIInsight } from '@/lib/ai/insights-engine';
import Link from 'next/link';

interface InsightCardProps {
    insight: AIInsight;
    onDismiss?: (id: string) => void;
    onAction?: (insight: AIInsight) => void;
    compact?: boolean;
}

const PRIORITY_STYLES = {
    low: 'border-slate-600 bg-slate-800/50',
    medium: 'border-blue-500/50 bg-blue-500/10',
    high: 'border-amber-500/50 bg-amber-500/10',
    critical: 'border-red-500/50 bg-red-500/10 animate-pulse',
};

const TYPE_ICONS: Record<string, typeof TrendingUp> = {
    spending_spike: TrendingUp,
    recurring_detected: RefreshCw,
    overpaying: TrendingDown,
    budget_warning: AlertTriangle,
    tip: Lightbulb,
    goal_progress: Target,
    streak_alert: Flame,
};

export default function InsightCard({ insight, onDismiss, onAction, compact = false }: InsightCardProps) {
    const Icon = TYPE_ICONS[insight.type] || Lightbulb;
    const priorityStyle = PRIORITY_STYLES[insight.priority];

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-xl border ${priorityStyle} flex items-center gap-3`}
            >
                <span className="text-xl">{insight.emoji}</span>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{insight.title}</p>
                </div>
                {insight.actionUrl && (
                    <Link href={insight.actionUrl}>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </Link>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border ${priorityStyle} relative`}
        >
            {/* Dismiss button */}
            {onDismiss && (
                <button
                    onClick={() => onDismiss(insight.id)}
                    className="absolute top-2 right-2 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="text-2xl">{insight.emoji}</div>
                <div className="flex-1 pr-6">
                    <h3 className="font-semibold text-sm md:text-base">{insight.title}</h3>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">{insight.message}</p>
                </div>
            </div>

            {/* Potential savings badge */}
            {insight.potentialSavings && insight.potentialSavings > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-full text-emerald-400 text-xs mb-3">
                    <span>💰</span>
                    <span>Możesz zaoszczędzić {(insight.potentialSavings / 100).toFixed(0)} zł</span>
                </div>
            )}

            {/* Action button */}
            {insight.actionLabel && insight.actionUrl && (
                <Link href={insight.actionUrl} className="block">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => onAction?.(insight)}
                    >
                        {insight.actionLabel}
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </Link>
            )}

            {/* Confidence indicator */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${insight.confidence * 100}%` }}
                    />
                </div>
                <span className="text-xs text-slate-500">
                    {Math.round(insight.confidence * 100)}% pewności
                </span>
            </div>
        </motion.div>
    );
}
