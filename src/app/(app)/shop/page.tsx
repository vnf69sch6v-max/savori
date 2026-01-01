'use client';

import { useState } from 'react';
import VirtualKitchen from '@/components/shop/VirtualKitchen';
import SNBLMarketplace from '@/components/shop/SNBLMarketplace';

export default function ShopPage() {
    const [activeTab, setActiveTab] = useState<'snbl' | 'kitchen'>('snbl');

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Tabs Header */}
            <div className="sticky top-0 z-10 py-4 bg-slate-950/80 backdrop-blur-md mb-2 flex justify-center">
                <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/50 shadow-xl">
                    <button
                        onClick={() => setActiveTab('snbl')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'snbl'
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <span>🛍️</span>
                        Save Now Buy Later
                    </button>
                    <button
                        onClick={() => setActiveTab('kitchen')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'kitchen'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <span>🧑‍🍳</span>
                        Wirtualna Kuchnia
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'snbl' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SNBLMarketplace />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <VirtualKitchen />
                    </div>
                )}
            </div>
        </div>
    );
}
