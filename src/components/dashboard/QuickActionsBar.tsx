'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Camera, Plus, MessageCircle, Sparkles } from 'lucide-react';

interface QuickActionsBarProps {
    onAddManual?: () => void;
    onOpenChat?: () => void;
}

export default function QuickActionsBar({ onAddManual, onOpenChat }: QuickActionsBarProps) {
    return (
        <div className="flex items-center justify-center gap-4 py-4">
            {/* Scan AI - Primary action */}
            <Link href="/scan">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/25"
                >
                    <div className="relative">
                        <Camera className="w-7 h-7 text-white" />
                        <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
                    </div>
                    <span className="text-sm font-medium text-white">Skanuj</span>
                </motion.button>
            </Link>

            {/* Add manual */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddManual}
                className="flex flex-col items-center gap-2 px-6 py-4 bg-slate-800/80 border border-slate-700 rounded-2xl hover:bg-slate-700/80 transition-colors"
            >
                <Plus className="w-7 h-7 text-slate-300" />
                <span className="text-sm font-medium text-slate-300">Dodaj</span>
            </motion.button>

            {/* AI Chat */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenChat}
                className="flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl hover:border-purple-500/50 transition-colors"
            >
                <MessageCircle className="w-7 h-7 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">Czat AI</span>
            </motion.button>
        </div>
    );
}
