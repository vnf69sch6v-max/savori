'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-service';
import { subscriptionService } from '@/lib/subscription-service';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
    highlightPlan?: 'pro' | 'premium';
}

export default function UpgradeModal({ isOpen, onClose, reason, highlightPlan = 'pro' }: UpgradeModalProps) {
    const { userData } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [yearly, setYearly] = useState(false);

    const handleUpgrade = async (planId: 'pro' | 'premium') => {
        if (!userData?.id) return;

        setLoading(planId);
        try {
            const result = await subscriptionService.upgradeSubscription(userData.id, planId, yearly);
            if (result.success) {
                toast.success(`🎉 Witamy w ${planId === 'pro' ? 'Pro' : 'Premium'}!`);
                onClose();
                // Reload to refresh subscription state
                window.location.reload();
            } else {
                toast.error(result.error || 'Błąd upgrade');
            }
        } catch (e) {
            toast.error('Błąd połączenia');
        } finally {
            setLoading(null);
        }
    };

    if (!isOpen) return null;

    const proPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'pro')!;
    const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium')!;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 text-center border-b border-slate-800">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">Odblokuj pełne możliwości</h2>
                        {reason && (
                            <p className="text-slate-400 mt-2">{reason}</p>
                        )}

                        {/* Yearly toggle */}
                        <div className="flex items-center justify-center gap-3 mt-4">
                            <span className={yearly ? 'text-slate-400' : 'font-medium'}>Miesięcznie</span>
                            <button
                                onClick={() => setYearly(!yearly)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${yearly ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${yearly ? 'left-8' : 'left-1'}`} />
                            </button>
                            <span className={yearly ? 'font-medium' : 'text-slate-400'}>
                                Rocznie <span className="text-emerald-400 text-sm">-37%</span>
                            </span>
                        </div>
                    </div>

                    {/* Plans */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pro Plan */}
                        <div className={`relative p-5 rounded-xl border-2 transition-all ${highlightPlan === 'pro' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/30'
                            }`}>
                            {highlightPlan === 'pro' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-xs font-bold rounded-full">
                                    REKOMENDOWANY
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-bold">{proPlan.name}</h3>
                            </div>

                            <div className="mb-4">
                                <span className="text-3xl font-bold">
                                    {yearly ? (proPlan.yearlyPrice / 12).toFixed(0) : proPlan.price.toFixed(0)}
                                </span>
                                <span className="text-slate-400"> zł/mies</span>
                                {yearly && (
                                    <p className="text-xs text-slate-400">{proPlan.yearlyPrice} zł/rok</p>
                                )}
                            </div>

                            <ul className="space-y-2 mb-4">
                                {proPlan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleUpgrade('pro')}
                                disabled={loading === 'pro'}
                                className="w-full"
                            >
                                {loading === 'pro' ? 'Przetwarzanie...' : 'Wybierz Pro'}
                            </Button>
                        </div>

                        {/* Ultimate Plan */}
                        <div className={`relative p-5 rounded-xl border-2 transition-all ${premiumPlan.isHighlighted
                            ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/30'
                            : 'border-slate-700 bg-slate-800/30'
                            }`}>
                            {premiumPlan.isHighlighted && premiumPlan.highlightBadge && (
                                <div className="absolute -top-3 right-4 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-slate-800 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
                                        NAJLEPSZA WARTOŚĆ
                                    </span>
                                    <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                        {premiumPlan.highlightBadge}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                                <Crown className="w-5 h-5 text-amber-400" />
                                <h3 className="text-lg font-bold">{premiumPlan.name}</h3>
                            </div>

                            <div className="mb-4">
                                <span className="text-3xl font-bold">
                                    {yearly ? (premiumPlan.yearlyPrice / 12).toFixed(0) : premiumPlan.price.toFixed(0)}
                                </span>
                                <span className="text-slate-400"> zł/mies</span>
                                {yearly && (
                                    <p className="text-xs text-slate-400">{premiumPlan.yearlyPrice} zł/rok</p>
                                )}
                            </div>

                            <ul className="space-y-2 mb-4">
                                {premiumPlan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleUpgrade('premium')}
                                disabled={loading === 'premium'}
                                variant="outline"
                                className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                            >
                                {loading === 'premium' ? 'Przetwarzanie...' : 'Wybierz Ultimate'}
                            </Button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 text-center">
                        <p className="text-xs text-slate-500">
                            Możesz anulować w dowolnym momencie. Bezpieczne płatności.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
