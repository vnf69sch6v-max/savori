export type Language = 'pl' | 'en';

export const translations = {
    pl: {
        common: {
            loading: 'Ładowanie...',
            save: 'Zapisz',
            cancel: 'Anuluj',
            delete: 'Usuń',
            edit: 'Edytuj',
            close: 'Zamknij',
            back: 'Wróć',
            error: 'Błąd',
            success: 'Sukces',
        },
        dashboard: {
            greeting: {
                morning: 'Dzień dobry',
                afternoon: 'Cześć',
                evening: 'Dobry wieczór',
            },
            balance: 'Dostępne środki',
            savings: 'Oszczędności',
            expenses: 'Wydatki',
            goals: 'Cele',
            recentTransactions: 'Ostatnie Transakcje',
            seeAll: 'Zobacz wszystkie',
            emptyState: 'Brak danych',
        },
        categories: {
            groceries: 'Spożywcze',
            restaurants: 'Jedzenie na mieście',
            transport: 'Transport',
            utilities: 'Rachunki',
            entertainment: 'Rozrywka',
            shopping: 'Zakupy',
            health: 'Zdrowie',
            education: 'Edukacja',
            subscriptions: 'Subskrypcje',
            other: 'Inne',
        }
    },
    en: {
        common: {
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            back: 'Back',
            error: 'Error',
            success: 'Success',
        },
        dashboard: {
            greeting: {
                morning: 'Good morning',
                afternoon: 'Hello',
                evening: 'Good evening',
            },
            balance: 'Available Balance',
            savings: 'Total Savings',
            expenses: 'Expenses',
            goals: 'Goals',
            recentTransactions: 'Recent Transactions',
            seeAll: 'See all',
            emptyState: 'No data',
        },
        categories: {
            groceries: 'Groceries',
            restaurants: 'Dining Out',
            transport: 'Transport',
            utilities: 'Utilities',
            entertainment: 'Entertainment',
            shopping: 'Shopping',
            health: 'Health',
            education: 'Education',
            subscriptions: 'Subscriptions',
            other: 'Other',
        }
    }
};

export type TranslationKey = keyof typeof translations.pl;
