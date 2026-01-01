export const translations = {
    pl: {
        common: {
            loading: 'Ładowanie...',
            error: 'Wystąpił błąd',
            save: 'Zapisz',
            saved: 'Zapisano',
            cancel: 'Anuluj',
            delete: 'Usuń',
            edit: 'Edytuj',
            add: 'Dodaj',
        },
        dashboard: {
            safeToSpend: 'Bezpiecznie do wydania',
            dailyBudget: 'dziennie do końca miesiąca',
            recentTransactions: 'Ostatnie transakcje',
            scanReceipt: 'Skanuj',
            addExpense: 'Dodaj',
            aiChat: 'Czat AI',
            welcome: 'Cześć',
        },
        settings: {
            title: 'Ustawienia',
            profile: 'Profil',
            preferences: 'Preferencje',
            language: 'Język',
            currency: 'Waluta',
            theme: 'Motyw',
            notifications: 'Powiadomienia',
            subscription: 'Subskrypcja',
            security: 'Bezpieczeństwo',
            export: 'Eksport danych',
            darkMode: 'Tryb ciemny',
            budgetLimit: 'Limit budżetu',
            saveThreshold: 'Cel oszczędności',
        }
    },
    en: {
        common: {
            loading: 'Loading...',
            error: 'An error occurred',
            save: 'Save',
            saved: 'Saved',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            add: 'Add',
        },
        dashboard: {
            safeToSpend: 'Safe to spend',
            dailyBudget: 'daily until end of month',
            recentTransactions: 'Recent transactions',
            scanReceipt: 'Scan',
            addExpense: 'Add',
            aiChat: 'AI Chat',
            welcome: 'Hello',
        },
        settings: {
            title: 'Settings',
            profile: 'Profile',
            preferences: 'Preferences',
            language: 'Language',
            currency: 'Currency',
            theme: 'Theme',
            notifications: 'Notifications',
            subscription: 'Subscription',
            security: 'Security',
            export: 'Data Export',
            darkMode: 'Dark Mode',
            budgetLimit: 'Budget Limit',
            saveThreshold: 'Savings Goal',
        }
    }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = string;
