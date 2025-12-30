'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, ArrowRight, Receipt, Target, Settings, Camera, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    type: 'page' | 'action' | 'expense';
    label: string;
    description?: string;
    icon: React.ReactNode;
    href?: string;
    action?: () => void;
}

// Quick pages and actions
const QUICK_ITEMS: SearchResult[] = [
    { type: 'action', label: 'Skanuj paragon', description: 'AI OCR', icon: <Camera className="w-4 h-4" />, href: '/scan' },
    { type: 'page', label: 'Dashboard', description: 'Przegląd finansów', icon: <BarChart3 className="w-4 h-4" />, href: '/dashboard' },
    { type: 'page', label: 'Wydatki', description: 'Historia transakcji', icon: <Receipt className="w-4 h-4" />, href: '/expenses' },
    { type: 'page', label: 'Cele', description: 'Cele oszczędnościowe', icon: <Target className="w-4 h-4" />, href: '/goals' },
    { type: 'page', label: 'Ustawienia', description: 'Konto i preferencje', icon: <Settings className="w-4 h-4" />, href: '/settings' },
];

export default function OmniSearch() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Filtered results based on query
    const results = query.trim() === ''
        ? QUICK_ITEMS
        : QUICK_ITEMS.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        );

    // Handle keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle selection
    const handleSelect = (result: SearchResult) => {
        if (result.href) {
            router.push(result.href);
        }
        if (result.action) {
            result.action();
        }
        setIsOpen(false);
        setQuery('');
    };

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            >
                <Search className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Szukaj...</span>
                <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-slate-700 rounded text-slate-400">
                    <Command className="w-2.5 h-2.5" />K
                </kbd>
            </button>

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4"
                        >
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                                {/* Search Input */}
                                <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
                                    <Search className="w-5 h-5 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Szukaj strony, akcji lub wydatku..."
                                        className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                                    />
                                    {query && (
                                        <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Results */}
                                <div className="max-h-80 overflow-y-auto py-2">
                                    {results.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-slate-500">
                                            Brak wyników dla "{query}"
                                        </div>
                                    ) : (
                                        <>
                                            {query.trim() === '' && (
                                                <p className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wider">
                                                    Szybkie akcje
                                                </p>
                                            )}
                                            {results.map((result, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSelect(result)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                                                        {result.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white">{result.label}</p>
                                                        {result.description && (
                                                            <p className="text-xs text-slate-400">{result.description}</p>
                                                        )}
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-500" />
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>

                                {/* Footer hint */}
                                <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                    <span>Nawiguj ↑↓</span>
                                    <span>Wybierz ↵</span>
                                    <span>Zamknij ESC</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
