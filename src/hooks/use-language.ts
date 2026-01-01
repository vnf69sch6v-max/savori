'use client';

import { create } from 'zustand';
import { translations, Language } from '@/lib/i18n';
import { persist } from 'zustand/middleware';

interface LanguageState {
    language: Language;
    currency: string;
    setLanguage: (lang: Language) => void;
    t: typeof translations.pl;
}

// Exchange rate: 1 EUR = 4.30 PLN (Approx)
const EUR_RATE = 4.30;

export const useLanguage = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'pl',
            currency: 'PLN',
            t: translations.pl,
            setLanguage: (lang) => set({
                language: lang,
                currency: lang === 'pl' ? 'PLN' : 'EUR',
                t: translations[lang]
            }),
        }),
        {
            name: 'language-storage',
        }
    )
);

/**
 * Hook to convert money based on current language/currency setting
 */
export const useCurrency = () => {
    const { currency } = useLanguage();

    const format = (amountInCents: number) => {
        let amount = amountInCents / 100;
        let displayCurrency = 'PLN';

        if (currency === 'EUR') {
            amount = amount / EUR_RATE;
            displayCurrency = 'EUR';
        }

        return new Intl.NumberFormat(currency === 'PLN' ? 'pl-PL' : 'en-IE', {
            style: 'currency',
            currency: displayCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return { format, currency };
};
