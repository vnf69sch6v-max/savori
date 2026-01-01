'use client';

import { ScanLine, Plus, ShieldAlert, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionGridProps {
    onScanClick?: () => void;
    onAddClick: () => void;
    onImpulseClick: () => void;
    onChatClick: () => void;
}

export default function ActionGrid({ onScanClick, onAddClick, onImpulseClick, onChatClick }: ActionGridProps) {
    const actions = [
        {
            label: 'Skanuj',
            icon: ScanLine,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            onClick: onScanClick,
            href: '/scan'
        },
        {
            label: 'Dodaj',
            icon: Plus,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            onClick: onAddClick,
            href: '/add'
        },
        {
            label: 'Impuls',
            icon: ShieldAlert,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            onClick: onImpulseClick,
        },
        {
            label: 'Czat AI',
            icon: MessageSquare,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            onClick: onChatClick,
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3 w-full">
            {actions.map((action, index) => (
                <motion.button
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className={`
                        h-24 w-full 
                        flex flex-col items-center justify-center gap-2
                        rounded-2xl border ${action.border} ${action.bg} 
                        backdrop-blur-sm transition-all
                    `}
                >
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                    <span className={`text-xs font-medium ${action.color} opacity-90`}>
                        {action.label}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}
