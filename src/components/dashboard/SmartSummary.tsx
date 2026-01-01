import { useMemo } from 'react';
import { Expense } from '@/types';
import { formatMoney } from '@/lib/utils';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartSummaryProps {
    expenses: Expense[];
    userName: string;
    currency: string;
    budget: number;
}

export default function SmartSummary({ expenses, userName, currency, budget }: SmartSummaryProps) {
    const summary = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayExpenses = expenses.filter(e => {
            const d = e.date instanceof Date ? e.date : (e.date as any)?.toDate?.() || new Date(e.date as any);
            return d >= startOfDay;
        });

        const weeklyExpenses = expenses.filter(e => {
            const d = e.date instanceof Date ? e.date : (e.date as any)?.toDate?.() || new Date(e.date as any);
            return d >= startOfWeek;
        });

        const monthlyExpenses = expenses.filter(e => {
            const d = e.date instanceof Date ? e.date : (e.date as any)?.toDate?.() || new Date(e.date as any);
            return d >= startOfMonth;
        });

        const todayTotal = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const weeklyTotal = weeklyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyBudget = budget / daysInMonth;

        // Logic for "Story"
        if (todayTotal > dailyBudget * 2) {
            return {
                title: 'Ostrożnie z wydatkami! 💸',
                message: `Dziś wydałeś ${formatMoney(todayTotal, currency)}, co znacząco przekracza dzienny budżet. Spróbuj zwolnić.`,
                icon: <TrendingUp className="w-5 h-5 text-rose-400" />,
                color: 'text-rose-400'
            };
        }

        if (monthlyTotal < (budget * (now.getDate() / daysInMonth)) * 0.9) {
            return {
                title: 'Jesteś w świetnej formie! 🚀',
                message: `W tym miesiącu wydałeś ${formatMoney(monthlyTotal, currency)}, czyli mniej niż planowano. Oszczędzasz na coś ekstra?`,
                icon: <TrendingDown className="w-5 h-5 text-emerald-400" />,
                color: 'text-emerald-400'
            };
        }

        if (todayTotal === 0 && now.getHours() > 12) {
            return {
                title: 'Dzień bez wydatków? 🌟',
                message: `Wygląda na to, że dziś nic nie wydałeś. Tak trzymaj!`,
                icon: <Sparkles className="w-5 h-5 text-amber-400" />,
                color: 'text-amber-400'
            };
        }

        return {
            title: `Witaj, ${userName}! 👋`,
            message: `W tym miesiącu wydałeś łącznie ${formatMoney(monthlyTotal, currency)}. Masz jeszcze ${formatMoney(Math.max(0, budget - monthlyTotal), currency)} do wykorzystania.`,
            icon: <Sparkles className="w-5 h-5 text-blue-400" />,
            color: 'text-blue-400'
        };

    }, [expenses, userName, currency, budget]);

    return (
        <div className="mb-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={summary.title}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        {summary.title}
                    </h1>
                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                        {summary.icon}
                        <span>{summary.message}</span>
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
