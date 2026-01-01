/**
 * PII Redactor Service
 * Removes/masks Personally Identifiable Information before sending data to AI APIs
 */

// Patterns for PII detection
const PII_PATTERNS = {
    // Polish NIP (tax ID) - 10 digits with optional dashes
    nip: /\b\d{3}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}\b|\b\d{10}\b/g,

    // PESEL (Polish national ID) - 11 digits
    pesel: /\b\d{11}\b/g,

    // Credit/Debit card numbers - 16 digits with optional spaces/dashes
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,

    // IBAN - starts with country code, then check digits, then up to 30 chars
    iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/gi,

    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // Phone numbers (Polish format)
    phone: /(?:\+48[\s-]?)?\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,

    // Postal codes (Polish XX-XXX format)
    postalCode: /\b\d{2}-\d{3}\b/g,

    // Names in receipts (after "Obsługiwał", "Kasjer" etc.)
    cashierName: /(?:Obsługiwał|Kasjer|Sprzedawca)[\s:]*([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?)/gi,
};

// Replacement masks
const MASKS = {
    nip: '[NIP-MASKED]',
    pesel: '[PESEL-MASKED]',
    creditCard: '[CARD-XXXX]',
    iban: '[IBAN-MASKED]',
    email: '[EMAIL-MASKED]',
    phone: '[PHONE-MASKED]',
    postalCode: '[POSTAL-MASKED]',
    cashierName: 'Pracownik sklepu',
};

interface RedactionResult {
    text: string;
    redactedCount: number;
    types: string[];
}

/**
 * Redact all PII from a text string
 */
export function redactPII(text: string): RedactionResult {
    if (!text || typeof text !== 'string') {
        return { text: text || '', redactedCount: 0, types: [] };
    }

    let result = text;
    let count = 0;
    const types: Set<string> = new Set();

    // Apply each pattern
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        const matches = result.match(pattern);
        if (matches && matches.length > 0) {
            count += matches.length;
            types.add(type);
            result = result.replace(pattern, MASKS[type as keyof typeof MASKS] || '[REDACTED]');
        }
    }

    return {
        text: result,
        redactedCount: count,
        types: Array.from(types),
    };
}

/**
 * Redact PII from expense data before sending to AI
 */
export function redactExpenseForAI(expense: {
    merchant?: {
        name?: string;
        nip?: string;
        address?: string;
        category?: string;
    };
    amount?: number;
    items?: Array<{
        name?: string;
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
    }>;
    notes?: string;
    date?: unknown;
}): typeof expense {
    const result = { ...expense };

    // Redact merchant data
    if (result.merchant) {
        result.merchant = {
            ...result.merchant,
            // Keep name for categorization, but redact if it contains PII
            name: result.merchant.name ? redactPII(result.merchant.name).text : undefined,
            // Always redact sensitive fields
            nip: MASKS.nip,
            address: result.merchant.address ? MASKS.postalCode : undefined,
        };
    }

    // Redact items (keep product names, they're useful for AI)
    if (result.items) {
        result.items = result.items.map(item => ({
            ...item,
            name: item.name ? redactPII(item.name).text : item.name,
        }));
    }

    // Redact notes
    if (result.notes) {
        result.notes = redactPII(result.notes).text;
    }

    return result;
}

/**
 * Redact PII from array of expenses
 */
export function redactExpensesForAI(expenses: Parameters<typeof redactExpenseForAI>[0][]): ReturnType<typeof redactExpenseForAI>[] {
    return expenses.map(redactExpenseForAI);
}

/**
 * Anonymize user data for analytics
 */
export function anonymizeUserData(userData: {
    displayName?: string;
    email?: string;
    photoURL?: string;
    id?: string;
}): {
    displayName: string;
    email: string;
    photoURL: string | undefined;
    id: string;
} {
    return {
        displayName: 'Użytkownik',
        email: MASKS.email,
        photoURL: undefined,
        id: userData.id ? `user_${userData.id.substring(0, 8)}` : 'anonymous',
    };
}

/**
 * Check if text contains potential PII
 */
export function containsPII(text: string): boolean {
    if (!text) return false;

    for (const pattern of Object.values(PII_PATTERNS)) {
        if (pattern.test(text)) {
            pattern.lastIndex = 0; // Reset regex state
            return true;
        }
    }
    return false;
}

/**
 * Generate a safe summary of redactions performed
 */
export function getRedactionSummary(result: RedactionResult): string {
    if (result.redactedCount === 0) {
        return 'Brak danych do redakcji';
    }
    return `Zredagowano ${result.redactedCount} element(ów): ${result.types.join(', ')}`;
}
