'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    PieChart,
    Calendar,
    Sparkles,
    Zap,
    Target,
    Award,
    ChevronDown,
    Flame,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense } from '@/types';
import AICommentary from '@/components/AICommentary';
import AnalystWidget from '@/components/analytics/AnalystWidget';
import CategoryRing from '@/components/analytics/CategoryRing';
import SpendingTrendChart from '@/components/analytics/SpendingTrendChart';

type Period = 'week' | 'month' | 'quarter' | 'year';

// Stagger animation container
const statsContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const statsItemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring' as const, damping: 20, stiffness: 200 },
    },
};

// Interactive stat card with hover effects and neon glow
function InteractiveStat({
    label,
    value,
    icon,
    color,
    glowColor,
    trend,
    onClick
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    glowColor?: string;
    trend?: { value: number; isPositive: boolean };
    onClick?: () => void;
}) {
    return (
        <motion.div
            variants={statsItemVariants}
            whileHover={{
                scale: 1.03,
                y: -4,
                boxShadow: glowColor || '0 20px 40px -15px rgba(139, 92, 246, 0.3)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`relative overflow-hidden cursor-pointer rounded-2xl p-5 bg-gradient-to-br ${color} border border-white/10 group backdrop-blur-sm`}
        >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-300" />
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/5 rounded-full blur-2xl group-hover:scale-150 group-hover:bg-white/10 transition-all duration-500" />
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-white/3 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/70 font-medium">{label}</span>
                    <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className="text-white/80 p-1.5 rounded-lg bg-white/5"
                    >
                        {icon}
                    </motion.div>
                </div>
                <p className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</p>
                {trend && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                        {trend.isPositive ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        <span>{Math.abs(trend.value)}% vs ostatni okres</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// Achievement-style insight card
function InsightAchievement({
    icon,
    title,
    value,
    description,
    color,
    delay
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    color: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.02 }}
            className={`relative overflow-hidden p-4 rounded-xl bg-gradient-to-br ${color} border border-white/10 cursor-pointer group`}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <div className="flex items-start gap-3 relative">
                <div className="p-2 rounded-lg bg-white/10">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70">{title}</p>
                    <p className="text-lg font-bold text-white">{value}</p>
                    <p className="text-xs text-white/50 truncate">{description}</p>
                </div>
                <Zap className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </motion.div>
    );
}

export default function AnalyticsPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('month');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [forecastData, setForecastData] = useState<{ date: string; amount: number }[] | undefined>(undefined);

    const handleRequestForecast = async () => {
        try {
            const response = await fetch('/api/ai-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'forecast',
                    data: { expenses: expenses.slice(0, 50) } // Send recent expenses
                })
            });
            const res = await response.json();
            if (res.success) {
                setForecastData(res.data);
            }
        } catch (error) {
            console.error('Forecast failed', error);
        }
    };

    // Get date range
    const getDateRange = (p: Period) => {
        const now = new Date();
        const start = new Date();

        switch (p) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }

        return { start, end: now };
    };

    // Fetch expenses
    useEffect(() => {
        if (!userData?.id) {
            const timer = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timer);
        }

        const { start } = getDateRange(period);
        const expensesRef = collection(db, 'users', userData.id, 'expenses');
        const q = query(
            expensesRef,
            where('date', '>=', Timestamp.fromDate(start)),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            setExpenses(data);
            setTimeout(() => setLoading(false), 0);
        });

        return () => unsubscribe();
    }, [userData?.id, period]);

    // Clear forecast on period change
    useEffect(() => {
        setForecastData(undefined);
    }, [period]);

    // Calculate stats
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    const avgDaily = totalExpenses / days;
    const transactionCount = expenses.length;
    const avgTransaction = transactionCount > 0 ? totalExpenses / transactionCount : 0;

    // Category breakdown
    const categoryData = Object.entries(
        expenses.reduce((acc, e) => {
            const cat = e.merchant?.category || 'other';
            acc[cat] = (acc[cat] || 0) + (e.amount || 0);
            return acc;
        }, {} as Record<string, number>)
    )
        .map(([category, amount]) => ({
            category,
            name: CATEGORY_LABELS[category] || category,
            amount,
            color: CATEGORY_COLORS[category] || '#6b7280',
            icon: CATEGORY_ICONS[category] || '📦',
        }))
        .sort((a, b) => b.amount - a.amount);

    // Daily trend with area chart
    const dailyData = expenses.reduce((acc, e) => {
        const date = e.date?.toDate?.()?.toISOString().split('T')[0] || '';
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += e.amount || 0;
        return acc;
    }, {} as Record<string, number>);

    const trendData = Object.entries(dailyData)
        .map(([date, amount]) => ({
            date: new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
            fullDate: date,
            amount: amount / 100,
        }))
        .reverse()
        .slice(-14);

    // Top merchants
    const merchantData = Object.entries(
        expenses.reduce((acc, e) => {
            const name = e.merchant?.name || 'Nieznany';
            acc[name] = (acc[name] || 0) + (e.amount || 0);
            return acc;
        }, {} as Record<string, number>)
    )
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    const periodLabels = {
        week: 'Tydzień',
        month: 'Miesiąc',
        quarter: 'Kwartał',
        year: 'Rok',
    };

    const periodIcons = {
        week: '7d',
        month: '30d',
        quarter: '90d',
        year: '365d',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-20">
            {/* Header with animated background */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/30 border border-slate-800 p-6 mb-6">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl md:text-4xl font-bold flex items-center gap-3"
                        >
                            <BarChart3 className="w-8 h-8 text-purple-400" />
                            Analityka
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-400 mt-2 flex items-center gap-2"
                        >
                            Zagłęb się w swoje finanse
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </motion.p>
                    </div>

                    {/* Period selector with animation */}
                    <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl">
                        {(['week', 'month', 'quarter', 'year'] as Period[]).map((p) => (
                            <motion.button
                                key={p}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <span className="hidden sm:inline">{periodLabels[p]}</span>
                                <span className="sm:hidden">{periodIcons[p]}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-2xl bg-slate-800/50 animate-pulse" />
                    ))}
                </div>
            ) : expenses.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800"
                >
                    <BarChart3 className="w-20 h-20 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Brak danych do analizy</h3>
                    <p className="text-slate-400 mb-6">Dodaj wydatki, aby zobaczyć szczegółowe statystyki</p>
                    <Button>Dodaj pierwszy wydatek</Button>
                </motion.div>
            ) : (
                <>
                    {/* AI Analyst Widget */}
                    <div className="mb-6 grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AICommentary
                                categoryData={categoryData}
                                totalExpenses={totalExpenses}
                                avgDaily={avgDaily}
                                period={period}
                                merchantData={merchantData}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <AnalystWidget expenses={expenses} onRequestForecast={handleRequestForecast} />
                        </div>
                    </div>

                    {/* Quick Stats Row with Stagger Animation */}
                    <motion.div
                        variants={statsContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                    >
                        <InteractiveStat
                            label="Suma wydatków"
                            value={formatMoney(totalExpenses)}
                            icon={<Flame className="w-5 h-5" />}
                            color="from-rose-500/20 to-pink-500/20"
                            glowColor="0 20px 40px -15px rgba(244, 63, 94, 0.4)"
                        />
                        <InteractiveStat
                            label="Średnio dziennie"
                            value={formatMoney(avgDaily)}
                            icon={<Calendar className="w-5 h-5" />}
                            color="from-blue-500/20 to-cyan-500/20"
                            glowColor="0 20px 40px -15px rgba(59, 130, 246, 0.4)"
                        />
                        <InteractiveStat
                            label="Transakcji"
                            value={transactionCount.toString()}
                            icon={<BarChart3 className="w-5 h-5" />}
                            color="from-purple-500/20 to-violet-500/20"
                            glowColor="0 20px 40px -15px rgba(139, 92, 246, 0.4)"
                        />
                        <InteractiveStat
                            label="Śr. wartość"
                            value={formatMoney(avgTransaction)}
                            icon={<Target className="w-5 h-5" />}
                            color="from-emerald-500/20 to-teal-500/20"
                            glowColor="0 20px 40px -15px rgba(16, 185, 129, 0.4)"
                        />
                    </motion.div>

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-3 gap-6 mb-6">
                        {/* Trend Chart - Area chart for dopamine */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-2"
                        >
                            <SpendingTrendChart data={trendData} forecastData={forecastData} />
                        </motion.div>

                        {/* Category Ring */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="h-full bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-700/50">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <PieChart className="w-5 h-5 text-blue-400" />
                                        Kategorie
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CategoryRing
                                        data={categoryData}
                                        onSelect={(cat) => setSelectedCategory(cat === selectedCategory ? null : cat)}
                                    />

                                    {/* Category list */}
                                    <div className="space-y-2 mt-4">
                                        {(showAllCategories ? categoryData : categoryData.slice(0, 3)).map((cat, i) => (
                                            <motion.div
                                                key={cat.category}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                whileHover={{ x: 4 }}
                                                onClick={() => setSelectedCategory(cat.category === selectedCategory ? null : cat.category)}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${selectedCategory === cat.category
                                                    ? 'bg-white/10'
                                                    : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className="text-lg">{cat.icon}</span>
                                                <span className="flex-1 text-sm">{cat.name}</span>
                                                <span className="text-sm text-slate-400">{formatMoney(cat.amount)}</span>
                                            </motion.div>
                                        ))}
                                        {categoryData.length > 3 && (
                                            <button
                                                onClick={() => setShowAllCategories(!showAllCategories)}
                                                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                                            >
                                                {showAllCategories ? 'Pokaż mniej' : `+${categoryData.length - 3} więcej`}
                                                <ChevronDown className={`w-4 h-4 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Achievement-style Insights Row */}
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <InsightAchievement
                            icon={<Award className="w-5 h-5 text-amber-400" />}
                            title="Top Kategoria"
                            value={categoryData[0]?.name || '—'}
                            description={`${Math.round((categoryData[0]?.amount / totalExpenses) * 100)}% Twoich wydatków`}
                            color="from-amber-500/10 to-orange-500/10"
                            delay={0}
                        />
                        <InsightAchievement
                            icon={<Target className="w-5 h-5 text-emerald-400" />}
                            title="Dzienny limit"
                            value={formatMoney(avgDaily)}
                            description="Średnia z tego okresu"
                            color="from-emerald-500/10 to-teal-500/10"
                            delay={0.1}
                        />
                        <InsightAchievement
                            icon={<Sparkles className="w-5 h-5 text-purple-400" />}
                            title="Największy wydatek"
                            value={merchantData[0]?.name || '—'}
                            description={formatMoney(merchantData[0]?.amount || 0)}
                            color="from-purple-500/10 to-pink-500/10"
                            delay={0.2}
                        />
                    </div>

                    {/* Top Merchants with interactive bars */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                    Gdzie wydajesz najwięcej
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {merchantData.map((merchant, i) => {
                                        const percentage = (merchant.amount / merchantData[0].amount) * 100;
                                        return (
                                            <motion.div
                                                key={merchant.name}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                whileHover={{ scale: 1.01 }}
                                                className="group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium group-hover:text-emerald-400 transition-colors">
                                                                {merchant.name}
                                                            </span>
                                                            <span className="text-slate-400 group-hover:text-white transition-colors">
                                                                {formatMoney(merchant.amount)}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </div>
    );
}
