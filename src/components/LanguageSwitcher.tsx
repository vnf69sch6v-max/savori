'use client';

import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui';

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
            <button
                onClick={() => setLanguage('pl')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === 'pl'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
            >
                PL
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === 'en'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
            >
                EN
            </button>
        </div>
    );
}
