'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Plus,
    Calendar,
    TrendingUp,
    Bell,
    MoreVertical,
    Trash2,
    Edit3,
    Pause,
    Play,
    AlertTriangle,
    Check,
    X,
    Sparkles,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { formatMoney } from '@/lib/utils';
import {
    recurringExpensesService,
    RecurringExpense,
    getFrequencyLabel,
    getMonthlyEquivalent,
} from '@/lib/subscriptions/recurring-service';
import { KNOWN_SUBSCRIPTIONS, searchSubscriptions, KnownSubscription } from '@/lib/subscriptions/known-services';
import toast from 'react-hot-toast';

// Add subscription modal
function AddSubscriptionModal({
    isOpen,
    onClose,
    onAdd,
}: {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, amount: number, frequency: string) => void;
}) {
    const [search, setSearch] = useState('');
    const [selectedService, setSelectedService] = useState<KnownSubscription | null>(null);
    const [customName, setCustomName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');

    const suggestions = search.length > 0 ? searchSubscriptions(search) : [];

    const handleSubmit = () => {
        const name = selectedService?.name || customName;
        const amountValue = parseFloat(amount) * 100;

        if (!name || !amountValue) {
            toast.error('Wypełnij wszystkie pola');
            return;
        }

        onAdd(name, amountValue, frequency);
        onClose();
        setSearch('');
        setSelectedService(null);
        setCustomName('');
        setAmount('');
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
            >
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                        Dodaj subskrypcję
                    </h2>

                    {/* Search known services */}
                    <div className="mb-4">
                        <label className="text-sm text-slate-400 mb-1 block">Nazwa serwisu</label>
                        <input
                            type="text"
                            value={selectedService ? selectedService.name : search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setSelectedService(null);
                            }}
                            placeholder="Netflix, Spotify, iCloud..."
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        {/* Suggestions */}
                        {suggestions.length > 0 && !selectedService && (
                            <div className="mt-2 p-2 bg-slate-800 rounded-xl border border-slate-700 max-h-40 overflow-y-auto">
                                {suggestions.slice(0, 5).map((service) => (
                                    <button
                                        key={service.name}
                                        onClick={() => {
                                            setSelectedService(service);
                                            setSearch('');
                                            if (service.avgPrice) {
                                                setAmount((service.avgPrice / 100).toString());
                                            }
                                            setFrequency(service.frequency === 'yearly' ? 'yearly' : 'monthly');
                                        }}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
                                    >
                                        <span className="text-xl">{service.emoji}</span>
                                        <span>{service.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Custom name if not selected */}
                    {!selectedService && search.length > 0 && suggestions.length === 0 && (
                        <div className="mb-4">
                            <p className="text-sm text-slate-400 mb-2">
                                Nie znaleziono. Dodaj własną nazwę:
                            </p>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Nazwa subskrypcji"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    )}

                    {/* Amount */}
                    <div className="mb-4">
                        <label className="text-sm text-slate-400 mb-1 block">Kwota (PLN)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="49.00"
                            step="0.01"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Frequency */}
                    <div className="mb-6">
                        <label className="text-sm text-slate-400 mb-2 block">Częstotliwość</label>
                        <div className="flex gap-2">
                            {(['monthly', 'yearly'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFrequency(f)}
                                    className={`flex-1 py-2 rounded-xl font-medium transition-all ${frequency === f
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {f === 'monthly' ? 'Miesięcznie' : 'Rocznie'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} className="flex-1">
                            Anuluj
                        </Button>
                        <Button onClick={handleSubmit} className="flex-1">
                            <Plus className="w-4 h-4 mr-2" />
                            Dodaj
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Subscription card
function SubscriptionCard({
    expense,
    onDelete,
    onToggle,
}: {
    expense: RecurringExpense;
    onDelete: () => void;
    onToggle: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [now] = useState(() => Date.now());
    const monthlyAmount = getMonthlyEquivalent(expense.amount, expense.frequency);
    const daysUntilDue = Math.ceil(
        (expense.nextDueDate.toDate().getTime() - now) / (1000 * 60 * 60 * 24)
    );
    const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
    const isOverdue = daysUntilDue < 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="relative group"
        >
            <Card className={`overflow-hidden ${!expense.isActive ? 'opacity-50' : ''}`}>
                <div className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                style={{ backgroundColor: expense.color ? `${expense.color}20` : '#6366f120' }}
                            >
                                {expense.emoji}
                            </div>
                            <div>
                                <h3 className="font-semibold">{expense.name}</h3>
                                <p className="text-sm text-slate-400">
                                    {getFrequencyLabel(expense.frequency)}
                                    {expense.autoDetected && (
                                        <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded">
                                            Auto
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="font-bold text-lg">{formatMoney(expense.amount)}</p>
                            <p className="text-xs text-slate-500">
                                ~{formatMoney(monthlyAmount)}/msc
                            </p>
                        </div>
                    </div>

                    {/* Due date */}
                    <div className={`mt-3 flex items-center gap-2 text-sm ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                        {isOverdue ? (
                            <AlertTriangle className="w-4 h-4" />
                        ) : (
                            <Calendar className="w-4 h-4" />
                        )}
                        <span>
                            {isOverdue
                                ? `Przeterminowane (${Math.abs(daysUntilDue)} dni)`
                                : isDueSoon
                                    ? `Za ${daysUntilDue} dni`
                                    : expense.nextDueDate.toDate().toLocaleDateString('pl-PL', {
                                        day: 'numeric',
                                        month: 'short',
                                    })
                            }
                        </span>
                    </div>

                    {/* Quick actions */}
                    <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={onToggle}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {expense.isActive ? (
                                <>
                                    <Pause className="w-3 h-3" /> Wstrzymaj
                                </>
                            ) : (
                                <>
                                    <Play className="w-3 h-3" /> Wznów
                                </>
                            )}
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

export default function SubscriptionsPage() {
    const { userData } = useAuth();
    const [subscriptions, setSubscriptions] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [now] = useState(() => new Date()); // Changed to Date object for consistency with new derived state

    // Derived state
    const totalMonthly = subscriptions.reduce((sum, sub) => {
        return sum + getMonthlyEquivalent(sub.amount, sub.frequency);
    }, 0);

    const sortedSubscriptions = [...subscriptions].sort((a, b) => {
        return a.nextDueDate.seconds - b.nextDueDate.seconds;
    });

    const upcomingSubscriptions = sortedSubscriptions.filter(sub => {
        const dueDate = sub.nextDueDate.toDate();
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 7;
    });

    // Subscribe to recurring expenses
    useEffect(() => {
        if (!userData?.id) {
            setTimeout(() => setLoading(false), 0);
            return;
        }

        const unsubscribe = recurringExpensesService.subscribe(userData.id, (expenses) => {
            setSubscriptions(expenses);
            setTimeout(() => setLoading(false), 0);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    const handleAdd = async (name: string, amount: number, frequency: string) => {
        if (!userData?.id) return;

        try {
            const result = await recurringExpensesService.create(userData.id, {
                name,
                amount,
                frequency: frequency as 'monthly' | 'yearly',
            });

            if (result.isNew) {
                toast.success(`✅ Dodano ${name}`);
            } else {
                toast.success(`🔄 Zaktualizowano ${name}`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Błąd dodawania subskrypcji');
        }
    };

    const handleDelete = async (id: string) => {
        if (!userData?.id) return;

        if (!confirm('Czy na pewno chcesz usunąć tę subskrypcję?')) return;

        try {
            await recurringExpensesService.delete(userData.id, id);
            toast.success('Usunięto subskrypcję');
        } catch (error) {
            console.error(error);
            toast.error('Błąd usuwania');
        }
    };

    const handleToggle = async (expense: RecurringExpense) => {
        if (!userData?.id) return;

        try {
            await recurringExpensesService.update(userData.id, expense.id, {
                isActive: !expense.isActive,
            });
            toast.success(expense.isActive ? 'Wstrzymano' : 'Wznowiono');
        } catch (error) {
            console.error(error);
            toast.error('Błąd aktualizacji');
        }
    };

    // Separate active and inactive
    const activeSubscriptions = subscriptions.filter((s) => s.isActive);
    const inactiveSubscriptions = subscriptions.filter((s) => !s.isActive);

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-purple-400" />
                        Subskrypcje
                    </h1>
                    <p className="text-slate-400 mt-1">Zarządzaj stałymi opłatami</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Dodaj subskrypcję
                </Button>
            </div>

            {/* Reframing Summary - Daily Cost View */}
            <div className="mb-8">
                <Card className="bg-gradient-to-br from-purple-500/10 via-slate-800/50 to-indigo-500/10 border-purple-500/20 overflow-hidden">
                    <div className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            {/* Daily cost - psychological reframing */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm text-slate-400">Twój dzienny koszt subskrypcji</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white">
                                        {formatMoney(Math.round(totalMonthly / 30))}
                                    </span>
                                    <span className="text-slate-400">/dzień</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Mniej niż kawa ☕ → {formatMoney(totalMonthly)}/miesiąc
                                </p>
                            </div>

                            {/* Monthly progress */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-slate-400">Postęp miesiąca</span>
                                    <span className="text-emerald-400 font-medium">
                                        {Math.round((now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) * 100)}% za Tobą!
                                    </span>
                                </div>
                                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${(now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) * 100}%`
                                        }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1 text-right">
                                    Dzień {now.getDate()} z {new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="p-4 text-center">
                    <p className="text-sm text-slate-400 mb-1">Miesięcznie</p>
                    <p className="text-xl font-bold text-emerald-400">{formatMoney(totalMonthly)}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-slate-400 mb-1">Rocznie</p>
                    <p className="text-xl font-bold text-blue-400">{formatMoney(totalMonthly * 12)}</p>
                </Card>
                <Card className="p-4 text-center">
                    <p className="text-sm text-slate-400 mb-1">Nadchodzi (7 dni)</p>
                    <p className="text-xl font-bold text-amber-400">{upcomingSubscriptions.length}</p>
                </Card>
            </div>

            {/* Upcoming payments */}
            {
                upcomingSubscriptions.length > 0 && (
                    <Card className="mb-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="w-4 h-4 text-amber-400" />
                                Nadchodzące płatności
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {upcomingSubscriptions.map((sub) => {
                                    const days = Math.ceil(
                                        (sub.nextDueDate.toDate().getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                                    );
                                    return (
                                        <div
                                            key={sub.id}
                                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{sub.emoji}</span>
                                                <div>
                                                    <p className="font-medium">{sub.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {days <= 0 ? 'Dzisiaj' : `Za ${days} dni`}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-amber-400">{formatMoney(sub.amount)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Main content */}
            {
                loading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
                        ))}
                    </div>
                ) : activeSubscriptions.length === 0 && inactiveSubscriptions.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">Brak subskrypcji</h3>
                        <p className="text-slate-400 mb-6">
                            Dodaj swoje stałe opłaty lub zeskanuj paragon - wykryjemy subskrypcje automatycznie!
                        </p>
                        <Button onClick={() => setShowAddModal(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Dodaj pierwszą subskrypcję
                        </Button>
                    </Card>
                ) : (
                    <>
                        {/* Active subscriptions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {activeSubscriptions.map((sub) => (
                                <SubscriptionCard
                                    key={sub.id}
                                    expense={sub}
                                    onDelete={() => handleDelete(sub.id)}
                                    onToggle={() => handleToggle(sub)}
                                />
                            ))}
                        </div>

                        {/* Inactive subscriptions */}
                        {inactiveSubscriptions.length > 0 && (
                            <div>
                                <h3 className="text-sm text-slate-500 uppercase tracking-wider mb-3">
                                    Wstrzymane ({inactiveSubscriptions.length})
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {inactiveSubscriptions.map((sub) => (
                                        <SubscriptionCard
                                            key={sub.id}
                                            expense={sub}
                                            onDelete={() => handleDelete(sub.id)}
                                            onToggle={() => handleToggle(sub)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )
            }

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddSubscriptionModal
                        isOpen={showAddModal}
                        onClose={() => setShowAddModal(false)}
                        onAdd={handleAdd}
                    />
                )}
            </AnimatePresence>
        </div >
    );
}
