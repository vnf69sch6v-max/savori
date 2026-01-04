'use client';

/**
 * BankTrustWarning - Educational comparison: Savori vs Banks
 * Explains why users should trust Savori with their data
 * Tone: Educational, not aggressive - facts over fear
 */

import { motion } from 'framer-motion';
import { Building2, Shield, TrendingUp, CreditCard, PiggyBank, Check, X } from 'lucide-react';

interface BankTrustWarningProps {
    className?: string;
    variant?: 'full' | 'compact' | 'inline';
}

export default function BankTrustWarning({
    className = '',
    variant = 'full'
}: BankTrustWarningProps) {

    if (variant === 'inline') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 ${className}`}
            >
                <div className="p-2 rounded-lg bg-blue-500/10">
                    <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                    <p className="text-sm text-slate-300">
                        <span className="font-medium text-blue-400">Ciekawostka:</span> Twoja apka bankowa pokazuje transakcje,
                        ale nie podpowie gdzie możesz zaoszczędzić. To robi Savori 😊
                    </p>
                </div>
            </motion.div>
        );
    }

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 ${className}`}
            >
                <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Dlaczego Savori?</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                    Banki zarabiają gdy używasz karty - nie mają interesu żebyś mniej wydawał.
                    My działamy na odwrót: im więcej oszczędzasz, tym lepiej! 💚
                </p>
            </motion.div>
        );
    }

    // Full variant
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 ${className}`}
        >
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                        <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Dlaczego my, a nie bank?</h3>
                        <p className="text-sm text-slate-400">Ważne różnice, które warto znać</p>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Header Row */}
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider" />
                    <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-700/30">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-400">Bank</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <PiggyBank className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">Savori</span>
                    </div>

                    {/* Row 1 */}
                    <div className="text-sm text-slate-400 flex items-center">Cel biznesowy</div>
                    <div className="text-sm text-center text-rose-400">Sprzedać Ci kredyt</div>
                    <div className="text-sm text-center text-emerald-400">Pomóc oszczędzać</div>

                    {/* Row 2 */}
                    <div className="text-sm text-slate-400 flex items-center">Analiza wydatków</div>
                    <div className="flex justify-center">
                        <X className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="flex justify-center">
                        <Check className="w-5 h-5 text-emerald-400" />
                    </div>

                    {/* Row 3 */}
                    <div className="text-sm text-slate-400 flex items-center">Porady oszczędnościowe</div>
                    <div className="flex justify-center">
                        <X className="w-5 h-5 text-rose-400" />
                    </div>
                    <div className="flex justify-center">
                        <Check className="w-5 h-5 text-emerald-400" />
                    </div>

                    {/* Row 4 */}
                    <div className="text-sm text-slate-400 flex items-center">Sprzedaż danych</div>
                    <div className="text-sm text-center text-amber-400">?</div>
                    <div className="text-sm text-center text-emerald-400">Nigdy</div>
                </div>

                {/* Bottom Message */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🔐</span>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Twoje dane są tylko Twoje. Nie sprzedajemy ich i nie będziemy Ci oferować kredytów.
                            <span className="text-emerald-400 font-medium"> Promise 🤞</span>
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
