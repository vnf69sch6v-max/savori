'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    Link2,
    CheckCircle2,
    Clock,
    RefreshCw,
    Shield,
    ChevronRight,
    Plus,
    CreditCard,
    Wallet,
    AlertCircle,
    Lock
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

interface BankAccount {
    id: string;
    bankName: string;
    bankLogo?: string;
    accountName: string;
    accountNumber: string; // masked
    balance: number;
    currency: string;
    lastSync: Date;
    status: 'connected' | 'pending' | 'error' | 'expired';
    type: 'checking' | 'savings' | 'credit';
}

interface OpenBankingHubProps {
    accounts?: BankAccount[];
    onConnect?: () => void;
    onSync?: (accountId: string) => void;
    onDisconnect?: (accountId: string) => void;
}

// Mock Polish banks
const SUPPORTED_BANKS = [
    { id: 'pkobp', name: 'PKO Bank Polski', logo: '🏦', color: '#00549F' },
    { id: 'mbank', name: 'mBank', logo: '🔵', color: '#00A6A0' },
    { id: 'santander', name: 'Santander', logo: '🔴', color: '#EC0000' },
    { id: 'ing', name: 'ING Bank Śląski', logo: '🟠', color: '#FF6200' },
    { id: 'pekao', name: 'Bank Pekao', logo: '🟢', color: '#D90A2C' },
    { id: 'millennium', name: 'Bank Millennium', logo: '💜', color: '#7B1FA2' },
    { id: 'alior', name: 'Alior Bank', logo: '⬛', color: '#003A5D' },
    { id: 'bnpparibas', name: 'BNP Paribas', logo: '🌿', color: '#00915A' },
];

export default function OpenBankingHub({
    accounts = [],
    onConnect,
    onSync,
    onDisconnect
}: OpenBankingHubProps) {
    const [showBankSelector, setShowBankSelector] = useState(false);
    const [connectingBank, setConnectingBank] = useState<string | null>(null);

    const handleBankSelect = async (bankId: string) => {
        setConnectingBank(bankId);
        // Simulate connection flow
        await new Promise(resolve => setTimeout(resolve, 2000));
        setConnectingBank(null);
        setShowBankSelector(false);
        onConnect?.();
    };

    const getStatusConfig = (status: BankAccount['status']) => {
        switch (status) {
            case 'connected':
                return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Połączony' };
            case 'pending':
                return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Oczekuje' };
            case 'error':
                return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Błąd' };
            case 'expired':
                return { icon: Lock, color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Wygasł' };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-500/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Open Banking</h2>
                            <p className="text-sm text-slate-400">
                                Połącz swoje konta bankowe
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
                        <Shield className="w-3 h-3" />
                        PSD2 Secure
                    </div>
                </div>

                <p className="text-sm text-slate-300 mb-4">
                    Automatycznie importuj transakcje z Twojego banku. Twoje dane są chronione
                    przez regulacje PSD2 i szyfrowane end-to-end.
                </p>

                <Button
                    onClick={() => setShowBankSelector(true)}
                    className="w-full"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Połącz konto bankowe
                </Button>
            </Card>

            {/* Connected Accounts */}
            {accounts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400">Połączone konta</h3>
                    {accounts.map((account) => {
                        const status = getStatusConfig(account.status);
                        const StatusIcon = status.icon;

                        return (
                            <motion.div
                                key={account.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-4 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl">
                                                {account.bankLogo || '🏦'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{account.bankName}</h4>
                                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${status.bg} ${status.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400">
                                                    {account.accountName} • {account.accountNumber}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-lg">
                                                {formatMoney(account.balance)}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Sync: {account.lastSync.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onSync?.(account.id)}
                                            className="flex-1"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Synchronizuj
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onDisconnect?.(account.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Odłącz
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {accounts.length === 0 && !showBankSelector && (
                <Card className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Brak połączonych kont</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Połącz swoje konto bankowe aby automatycznie importować transakcje
                    </p>
                </Card>
            )}

            {/* Bank Selector Modal */}
            <AnimatePresence>
                {showBankSelector && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowBankSelector(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-700">
                                <h3 className="font-bold text-lg">Wybierz bank</h3>
                                <p className="text-sm text-slate-400">
                                    Wspieramy większość polskich banków
                                </p>
                            </div>

                            <div className="p-4 space-y-2 max-h-80 overflow-auto">
                                {SUPPORTED_BANKS.map((bank) => (
                                    <motion.button
                                        key={bank.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handleBankSelect(bank.id)}
                                        disabled={!!connectingBank}
                                        className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <span className="text-2xl">{bank.logo}</span>
                                        <span className="flex-1 text-left font-medium">{bank.name}</span>
                                        {connectingBank === bank.id ? (
                                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-500" />
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-700 text-center">
                                <p className="text-xs text-slate-500">
                                    🔒 Połączenie zabezpieczone zgodnie z PSD2
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Demo accounts for testing
export const DEMO_ACCOUNTS: BankAccount[] = [
    {
        id: '1',
        bankName: 'PKO Bank Polski',
        bankLogo: '🏦',
        accountName: 'Konto Osobiste',
        accountNumber: '•••• 4521',
        balance: 1245600, // 12,456 zł
        currency: 'PLN',
        lastSync: new Date(),
        status: 'connected',
        type: 'checking',
    },
    {
        id: '2',
        bankName: 'mBank',
        bankLogo: '🔵',
        accountName: 'eKonto',
        accountNumber: '•••• 7832',
        balance: 532100,
        currency: 'PLN',
        lastSync: new Date(Date.now() - 3600000),
        status: 'connected',
        type: 'checking',
    },
];
