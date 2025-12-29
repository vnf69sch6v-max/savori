'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    PieChart,
    Calendar,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatMoney, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, ExpenseCategory } from '@/types';
import AICommentary from '@/components/AICommentary';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
} from 'recharts';

type Period = 'week' | 'month' | 'quarter' | 'year';

export default function AnalyticsPage() {
    const { userData } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('month');

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
            setLoading(false);
            return;
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
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id, period]);

    // Calculate stats
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const avgDaily = totalExpenses / (period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365);

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
        }))
        .sort((a, b) => b.amount - a.amount);

    // Daily trend
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

    // AI insights (demo)
    const insights = [
        `Największa kategoria wydatków: ${categoryData[0]?.name || 'brak danych'}`,
        `Średni dzienny wydatek: ${formatMoney(avgDaily)}`,
        categoryData.length > 1
            ? `${categoryData[0]?.name} stanowi ${Math.round((categoryData[0]?.amount / totalExpenses) * 100)}% wydatków`
            : '',
    ].filter(Boolean);

    const periodLabels = {
        week: 'Tydzień',
        month: 'Miesiąc',
        quarter: 'Kwartał',
        year: 'Rok',
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Analityka</h1>
                    <p className="text-slate-400 mt-1">
                        Wydatki w okresie: <span className="text-white font-medium">{formatMoney(totalExpenses)}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {(['week', 'month', 'quarter', 'year'] as Period[]).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {periodLabels[p]}
                        </Button>
                    ))}
                </div>
            </div>

            {/* AI Commentary */}
            {!loading && expenses.length > 0 && (
                <div className="mb-6">
                    <AICommentary
                        categoryData={categoryData}
                        totalExpenses={totalExpenses}
                        avgDaily={avgDaily}
                        period={period}
                        merchantData={merchantData}
                    />
                </div>
            )}

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton h-64 rounded-xl" />
                    ))}
                </div>
            ) : expenses.length === 0 ? (
                <Card className="p-12 text-center">
                    <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Brak danych</h3>
                    <p className="text-slate-400">
                        Dodaj wydatki, aby zobaczyć statystyki
                    </p>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Trend Chart */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                Trend wydatków
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            tickLine={false}
                                            tickFormatter={(v) => `${v} zł`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value) => [`${(value as number)?.toFixed(2) ?? 0} zł`, 'Wydatki']}
                                        />
                                        <Bar
                                            dataKey="amount"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Insights */}
                    <Card variant="gradient">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                Wnioski AI
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {insights.map((insight, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-2 text-sm"
                                    >
                                        <ArrowUpRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-300">{insight}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Category Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-blue-400" />
                                Kategorie
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="amount"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                            }}
                                            formatter={(value) => [formatMoney(value as number), 'Kwota']}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4">
                                {categoryData.slice(0, 4).map((cat) => (
                                    <div key={cat.category} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="text-slate-300">{cat.name}</span>
                                        </div>
                                        <span className="text-slate-400">{formatMoney(cat.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Merchants */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Top sprzedawcy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {merchantData.map((merchant, i) => (
                                    <motion.div
                                        key={merchant.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4"
                                    >
                                        <span className="text-slate-500 w-5 text-sm">{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium">{merchant.name}</span>
                                                <span className="text-slate-400">{formatMoney(merchant.amount)}</span>
                                            </div>
                                            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(merchant.amount / merchantData[0].amount) * 100}%` }}
                                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
