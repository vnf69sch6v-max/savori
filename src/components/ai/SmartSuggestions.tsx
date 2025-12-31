'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    AlertTriangle,
    TrendingDown,
    Lightbulb,
    ChevronRight,
    X,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

export interface SmartSuggestion {
    id: string;
    type: 'subscription' | 'spending' | 'budget' | 'savings';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: number;
    savingsPeriod?: 'monthly' | 'yearly';
    action?: {
        label: string;
        onClick?: () => void;
    };
    relatedData?: {
        name: string;
        amount: number;
        usageFrequency?: string;
    };
}

interface SmartSuggestionsCardProps {
    suggestions: SmartSuggestion[];
    onDismiss?: (id: string) => void;
    onAction?: (suggestion: SmartSuggestion) => void;
}

const priorityConfig = {
    high: {
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: AlertTriangle,
    },
    medium: {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        icon: Lightbulb,
    },
    low: {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: TrendingDown,
    },
};

export default function SmartSuggestionsCard({
    suggestions,
    onDismiss,
    onAction
}: SmartSuggestionsCardProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const activeSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
        onDismiss?.(id);
    };

    if (activeSuggestions.length === 0) {
        return (
            <Card className="p-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Wszystko optymalne! ✨</h3>
                        <p className="text-sm text-slate-400">
                            Nie znalazłem żadnych sugestii oszczędnościowych
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            AI Sugestie
                            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                                {activeSuggestions.length}
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400">Proaktywne rekomendacje</p>
                    </div>
                </div>
            </div>

            {/* Suggestions List */}
            <div className="divide-y divide-slate-700/50">
                <AnimatePresence>
                    {activeSuggestions.slice(0, 3).map((suggestion, index) => {
                        const config = priorityConfig[suggestion.priority];
                        const IconComponent = config.icon;
                        const isExpanded = expandedId === suggestion.id;

                        return (
                            <motion.div
                                key={suggestion.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="relative"
                            >
                                <div
                                    className="p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                            <IconComponent className={`w-4 h-4 ${config.color}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                                                {suggestion.potentialSavings && (
                                                    <span className="text-emerald-400 text-sm font-semibold whitespace-nowrap">
                                                        +{formatMoney(suggestion.potentialSavings)}
                                                        <span className="text-xs text-slate-400">
                                                            /{suggestion.savingsPeriod === 'yearly' ? 'rok' : 'msc'}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                                                {suggestion.description}
                                            </p>

                                            {/* Related data */}
                                            {suggestion.relatedData && (
                                                <div className="mt-2 flex items-center gap-2 text-xs">
                                                    <span className="px-2 py-0.5 bg-slate-700/50 rounded">
                                                        {suggestion.relatedData.name}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        {formatMoney(suggestion.relatedData.amount)}
                                                    </span>
                                                    {suggestion.relatedData.usageFrequency && (
                                                        <span className="text-slate-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {suggestion.relatedData.usageFrequency}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            className="text-slate-500"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </motion.div>
                                    </div>

                                    {/* Expanded actions */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="mt-3 flex gap-2"
                                            >
                                                {suggestion.action && (
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            suggestion.action?.onClick?.();
                                                            onAction?.(suggestion);
                                                        }}
                                                    >
                                                        {suggestion.action.label}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDismiss(suggestion.id);
                                                    }}
                                                >
                                                    Odrzuć
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Show more */}
            {activeSuggestions.length > 3 && (
                <div className="p-3 text-center border-t border-slate-700/50">
                    <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                        Zobacz więcej (+{activeSuggestions.length - 3})
                    </button>
                </div>
            )}
        </Card>
    );
}

// Example suggestions generator
export function generateMockSuggestions(): SmartSuggestion[] {
    return [
        {
            id: '1',
            type: 'subscription',
            priority: 'high',
            title: 'Netflix rzadko używany',
            description: 'Zauważyłem, że korzystasz z Netflix tylko 2 razy w ostatnim miesiącu. Rozważ anulowanie lub przejście na tańszy plan.',
            potentialSavings: 4300, // 43 zł * 100
            savingsPeriod: 'monthly',
            action: { label: 'Anuluj subskrypcję' },
            relatedData: {
                name: 'Netflix',
                amount: 4300,
                usageFrequency: '2 razy/miesiąc'
            }
        },
        {
            id: '2',
            type: 'spending',
            priority: 'medium',
            title: 'Wysokie wydatki na restauracje',
            description: 'W tym miesiącu wydałeś 450 zł na restauracje - 30% więcej niż zwykle. Może warto częściej gotować?',
            potentialSavings: 13500,
            savingsPeriod: 'monthly',
            action: { label: 'Zobacz przepisy' },
        },
        {
            id: '3',
            type: 'budget',
            priority: 'high',
            title: 'Za 5 dni przekroczysz budżet',
            description: 'Przy obecnym tempie wydatków, przekroczysz budżet na "Rozrywkę" przed końcem miesiąca.',
            action: { label: 'Dostosuj budżet' },
        },
    ];
}
