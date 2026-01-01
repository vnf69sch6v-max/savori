/**
 * PII Redaction Layer
 * Protects user privacy by masking sensitive data before AI processing.
 * Compliance: GDPR / RODO
 */

const PATTERNS = {
    // Basic Email
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

    // PL Phone numbers (various formats)
    PHONE_PL: /(?:\+48)?\s?(\d{3})\s?(\d{3})\s?(\d{3})/g,

    // PESEL (11 digits) - simplified check
    PESEL: /\b\d{11}\b/g,

    // IBAN (PL) - simplified
    IBAN_PL: /PL\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}[ ]\d{4}|PL\d{26}/g,

    // Credit Card (simple 16 digit check)
    CREDIT_CARD: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
};

export const redactor = {
    /**
     * Redact sensitive information from a string
     */
    text(str: string): string {
        if (!str) return str;

        return str
            .replace(PATTERNS.EMAIL, '<EMAIL>')
            .replace(PATTERNS.PHONE_PL, '<PHONE>')
            .replace(PATTERNS.PESEL, '<PESEL>')
            .replace(PATTERNS.IBAN_PL, '<IBAN>')
            .replace(PATTERNS.CREDIT_CARD, '<CARD>');
    },

    /**
     * Recursively redact an object
     */
    object<T>(obj: T): T {
        if (!obj) return obj;

        if (typeof obj === 'string') {
            return this.text(obj) as any;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.object(item)) as any;
        }

        if (typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    // Skip keys that shouldn't be redacted if they are structural (optional)
                    // For now, redact all string values
                    newObj[key] = this.object((obj as any)[key]);
                }
            }
            return newObj;
        }

        return obj;
    }
};
