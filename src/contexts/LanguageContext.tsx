'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/i18n/translations';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'pl',
    setLanguage: async () => { },
    t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { userData } = useAuth();
    const [language, setLanguageState] = useState<Language>('pl');

    // Sync with user data
    useEffect(() => {
        if (userData?.settings?.language) {
            setLanguageState(userData.settings.language as Language);
        }
    }, [userData?.settings?.language]);

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        if (userData?.id) {
            try {
                await updateDoc(doc(db, 'users', userData.id), {
                    'settings.language': lang
                });
            } catch (error) {
                console.error('Failed to save language preference:', error);
            }
        }
    };

    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                return key; // Fallback to key if not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
