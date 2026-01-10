import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formatuj kwotę w groszach do czytelnej formy
 * @param amountInCents - Kwota w groszach (np. 4550)
 * @param currency - Kod waluty (domyślnie PLN)
 * @returns Sformatowana kwota (np. "45,50 zł")
 */
export function formatMoney(amountInCents: number, currency: string = 'PLN'): string {
    const amount = amountInCents / 100;

    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Formatuj kwotę bez groszy gdy są zerowe (czystrzy wygląd Apple-style)
 * @param amountInCents - Kwota w groszach
 * @returns Sformatowana kwota (np. "45 zł" lub "45,50 zł")
 */
export function formatMoneyShort(amountInCents: number): string {
    const amount = amountInCents / 100;
    const hasDecimals = amount % 1 !== 0;

    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(amount);
}

/**
 * Parsuj kwotę tekstową do groszy
 * @param text - Tekst z kwotą (np. "45,50", "45.50 zł")
 * @returns Kwota w groszach
 */
export function parseMoneyToCents(text: string): number {
    // Usuń wszystko oprócz cyfr, kropek i przecinków
    const cleaned = text.replace(/[^\d.,]/g, '');
    // Zamień przecinek na kropkę
    const normalized = cleaned.replace(',', '.');
    // Parse i pomnóż przez 100
    return Math.round(parseFloat(normalized) * 100);
}

/**
 * Formatuj datę do polskiego formatu
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    let options: Intl.DateTimeFormatOptions;

    switch (format) {
        case 'short':
            options = { day: 'numeric', month: 'short' };
            break;
        case 'long':
            options = { day: 'numeric', month: 'long', year: 'numeric' };
            break;
        case 'time':
            options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
            break;
    }

    return new Intl.DateTimeFormat('pl-PL', options).format(d);
}

/**
 * Polskie nazwy kategorii wydatków
 */
export const CATEGORY_LABELS: Record<string, string> = {
    groceries: 'Groceries',
    restaurants: 'Restaurants',
    transport: 'Transport',
    utilities: 'Utilities',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    health: 'Health',
    education: 'Education',
    subscriptions: 'Subscriptions',
    other: 'Other',
};

/**
 * Kolory kategorii dla wykresów
 */
export const CATEGORY_COLORS: Record<string, string> = {
    groceries: '#10b981',
    restaurants: '#f59e0b',
    transport: '#3b82f6',
    utilities: '#8b5cf6',
    entertainment: '#ec4899',
    shopping: '#06b6d4',
    health: '#ef4444',
    education: '#84cc16',
    subscriptions: '#6366f1',
    other: '#6b7280',
};

/**
 * Ikony kategorii (emoji)
 */
export const CATEGORY_ICONS: Record<string, string> = {
    groceries: '🛒',
    restaurants: '🍔',
    transport: '🚗',
    utilities: '💡',
    entertainment: '🎬',
    shopping: '🛍️',
    health: '💊',
    education: '📚',
    subscriptions: '📱',
    other: '📦',
};

/**
 * Waliduj polski NIP
 */
export function validateNIP(nip: string): boolean {
    // Usuń kreski i spacje
    const cleaned = nip.replace(/[-\s]/g, '');

    if (cleaned.length !== 10 || !/^\d+$/.test(cleaned)) {
        return false;
    }

    // Wagi dla cyfr kontrolnych
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * weights[i];
    }

    const checkDigit = sum % 11;

    return checkDigit === parseInt(cleaned[9]);
}

/**
 * Generuj losowe ID
 */
export function generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
