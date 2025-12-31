'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    TrendingDown,
    ExternalLink,
    Sparkles,
    Tag,
    Percent,
    ShoppingBag,
    Zap,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

interface SavingsOpportunity {
    id: string;
    type: 'subscription' | 'utility' | 'insurance' | 'shopping';
    currentProvider: string;
    currentPrice: number;
    suggestedProvider: string;
    suggestedPrice: number;
    savings: number;
    savingsPeriod: 'monthly' | 'yearly';
    confidence: number;
    actionUrl?: string;
    promoCode?: string;
}

interface SavingsFinderProps {
    opportunities?: SavingsOpportunity[];
    isScanning?: boolean;
    onScan?: () => void;
    totalPotentialSavings?: number;
}

// Mock opportunities
const MOCK_OPPORTUNITIES: SavingsOpportunity[] = [
    {
        id: '1',
        type: 'subscription',
        currentProvider: 'Netflix Premium',
        currentPrice: 6000, // 60 zł
        suggestedProvider: 'Netflix Standard',
        suggestedPrice: 4300,
        savings: 1700,
        savingsPeriod: 'monthly',
        confidence: 0.95,
    },
    {
        id: '2',
        type: 'utility',
        currentProvider: 'Tauron (prąd)',
        currentPrice: 32000,
        suggestedProvider: 'Fortum',
        suggestedPrice: 27500,
        savings: 4500,
        savingsPeriod: 'monthly',
        confidence: 0.8,
        actionUrl: '#',
    },
    {
        id: '3',
        type: 'insurance',
        currentProvider: 'PZU Auto',
        currentPrice: 180000, // 1800 zł/rok
        suggestedProvider: 'Link4',
        suggestedPrice: 135000,
        savings: 45000,
        savingsPeriod: 'yearly',
        confidence: 0.75,
        actionUrl: '#',
    },
    {
        id: '4',
        type: 'shopping',
        currentProvider: 'Biedronka',
        currentPrice: 80000,
        suggestedProvider: 'Lidl (porównanie)',
        suggestedPrice: 72000,
        savings: 8000,
        savingsPeriod: 'monthly',
        confidence: 0.6,
        promoCode: 'LIDL10',
    },
];

const typeConfig = {
    subscription: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Subskrypcja' },
    utility: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Media' },
    insurance: { icon: Tag, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Ubezpieczenie' },
    shopping: { icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Zakupy' },
};

export default function SavingsFinder({
    opportunities = MOCK_OPPORTUNITIES,
    isScanning = false,
    onScan,
    totalPotentialSavings
}: SavingsFinderProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const activeOpportunities = opportunities.filter(o => !dismissedIds.has(o.id));

    // Calculate total savings
    const monthlySavings = activeOpportunities.reduce((sum, o) => {
        if (o.savingsPeriod === 'monthly') return sum + o.savings;
        return sum + Math.round(o.savings / 12);
    }, 0);

    const yearlySavings = monthlySavings * 12;

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-500/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                Savings Finder
                                <Sparkles className="w-4 h-4 text-amber-400" />
                            </h2>
                            <p className="text-sm text-slate-400">AI szuka tańszych alternatyw</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onScan}
                        disabled={isScanning}
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? 'Szukam...' : 'Skanuj'}
                    </Button>
                </div>

                {/* Savings Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-slate-400 mb-1">Potencjalne oszczędności</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            +{formatMoney(monthlySavings)}
                            <span className="text-sm text-slate-400 font-normal">/msc</span>
                        </p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-xl">
                        <p className="text-xs text-slate-400 mb-1">Rocznie zaoszczędzisz</p>
                        <p className="text-2xl font-bold text-teal-400">
                            +{formatMoney(yearlySavings)}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Opportunities List */}
            {activeOpportunities.length > 0 ? (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Znalezione oszczędności ({activeOpportunities.length})
                    </h3>

                    {activeOpportunities.map((opportunity, index) => {
                        const config = typeConfig[opportunity.type];
                        const TypeIcon = config.icon;
                        const isExpanded = expandedId === opportunity.id;

                        return (
                            <motion.div
                                key={opportunity.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card
                                    className="overflow-hidden cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : opportunity.id)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                                                <TypeIcon className={`w-5 h-5 ${config.color}`} />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-sm">{opportunity.currentProvider}</h4>
                                                    <span className={`px-1.5 py-0.5 text-[10px] rounded ${config.bg} ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400">
                                                    → {opportunity.suggestedProvider}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-emerald-400 font-semibold">
                                                    -{formatMoney(opportunity.savings)}
                                                    <span className="text-xs text-slate-400">
                                                        /{opportunity.savingsPeriod === 'yearly' ? 'rok' : 'msc'}
                                                    </span>
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    {Math.round(opportunity.confidence * 100)}% pewności
                                                </p>
                                            </div>

                                            <motion.div
                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                className="text-slate-500"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </motion.div>
                                        </div>

                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-4 pt-4 border-t border-slate-700/50"
                                                >
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="p-3 bg-slate-800/50 rounded-lg">
                                                            <p className="text-xs text-slate-500 mb-1">Obecnie płacisz</p>
                                                            <p className="font-semibold text-red-400 line-through">
                                                                {formatMoney(opportunity.currentPrice)}
                                                            </p>
                                                        </div>
                                                        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                            <p className="text-xs text-slate-500 mb-1">Nowa cena</p>
                                                            <p className="font-semibold text-emerald-400">
                                                                {formatMoney(opportunity.suggestedPrice)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {opportunity.promoCode && (
                                                        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-3">
                                                            <Percent className="w-4 h-4 text-amber-400" />
                                                            <span className="text-sm">Kod promocyjny:</span>
                                                            <code className="px-2 py-0.5 bg-slate-800 rounded font-mono text-amber-400">
                                                                {opportunity.promoCode}
                                                            </code>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        {opportunity.actionUrl && (
                                                            <Button size="sm" className="flex-1">
                                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                                Przejdź do oferty
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDismissedIds(prev => new Set([...prev, opportunity.id]));
                                                            }}
                                                        >
                                                            Odrzuć
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Brak nowych oszczędności</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Wszystkie Twoje wydatki są zoptymalizowane!
                    </p>
                    <Button variant="outline" onClick={onScan}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Skanuj ponownie
                    </Button>
                </Card>
            )}
        </div>
    );
}
