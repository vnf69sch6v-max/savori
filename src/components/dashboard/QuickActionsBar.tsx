'use client';

import { ScanLine, Plus, MessageSquare, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

interface QuickActionsBarProps {
    onAIChatClick: () => void;
    onImpulseClick?: () => void;
}

export default function QuickActionsBar({ onAIChatClick, onImpulseClick }: QuickActionsBarProps) {
    return (
        <div className="bg-slate-900/50 backdrop-blur-lg border-t border-slate-800 p-4 pb-8 fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                <Link href="/scan" className="col-span-1">
                    <Button variant="secondary" className="w-full h-12 flex flex-col gap-1 p-0 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700">
                        <ScanLine className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-medium text-slate-300">Skanuj</span>
                    </Button>
                </Link>

                <Link href="/add" className="col-span-1">
                    <Button variant="secondary" className="w-full h-12 flex flex-col gap-1 p-0 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700">
                        <Plus className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-medium text-slate-300">Dodaj</span>
                    </Button>
                </Link>

                <Button
                    variant="secondary"
                    className="col-span-1 w-full h-12 flex flex-col gap-1 p-0 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700"
                    onClick={onImpulseClick}
                >
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-medium text-slate-300">Impuls</span>
                </Button>

                <Button
                    onClick={onAIChatClick}
                    className="col-span-1 w-full h-12 flex flex-col gap-1 p-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 border border-indigo-400/30 shadow-lg shadow-indigo-500/20"
                >
                    <MessageSquare className="w-5 h-5 text-white" />
                    <span className="text-[10px] font-medium text-white">AI Chat</span>
                </Button>
            </div>
        </div>
    );
}
