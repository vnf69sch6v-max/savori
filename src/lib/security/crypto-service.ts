/**
 * Savori Crypto Service
 * Enterprise-grade AES-256-GCM encryption for sensitive financial data
 * Uses Web Crypto API for maximum security
 */

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM
const SALT_LENGTH = 16;
const KEY_STORAGE_KEY = 'savori_enc_key';

/**
 * Generate a cryptographically secure random IV
 */
function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derive an encryption key from user password/secret using PBKDF2
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000, // High iteration count for security
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Generate a new master encryption key for a user
 */
async function generateMasterKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: ALGORITHM, length: KEY_LENGTH },
        true, // extractable for storage
        ['encrypt', 'decrypt']
    );
}

/**
 * Export a key to base64 for storage
 */
async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import a key from base64 storage
 */
async function importKey(keyBase64: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt a string value
 * Returns: base64 encoded string with format "iv:ciphertext"
 */
async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const iv = generateIV();

    const ciphertext = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv: iv as BufferSource },
        key,
        encoder.encode(plaintext)
    );

    // Combine IV and ciphertext for storage
    const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a string value
 * Input: base64 encoded string with format "iv:ciphertext"
 */
async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv: iv as BufferSource },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Check if a string looks like encrypted data
 */
function isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    // Encrypted data is base64 and has minimum length (IV + some data)
    try {
        const decoded = atob(value);
        return decoded.length > IV_LENGTH;
    } catch {
        return false;
    }
}

/**
 * Crypto Service Singleton
 */
class CryptoService {
    private key: CryptoKey | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the crypto service - must be called before use
     */
    async initialize(userId: string): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = this._doInit(userId);
        return this.initPromise;
    }

    private async _doInit(userId: string): Promise<void> {
        if (typeof window === 'undefined') return; // Server-side

        const storageKey = `${KEY_STORAGE_KEY}_${userId}`;
        const storedKey = sessionStorage.getItem(storageKey);

        if (storedKey) {
            try {
                this.key = await importKey(storedKey);
                return;
            } catch (e) {
                console.warn('Failed to import stored key, generating new one');
                sessionStorage.removeItem(storageKey);
            }
        }

        // Generate new key
        const newKey = await generateMasterKey();
        const exportedKey = await exportKey(newKey);
        sessionStorage.setItem(storageKey, exportedKey);
        this.key = newKey;
    }

    /**
     * Get or create encryption key for a user
     */
    private async getKey(): Promise<CryptoKey> {
        if (!this.key) {
            throw new Error('CryptoService not initialized. Call initialize() first.');
        }
        return this.key;
    }

    /**
     * Encrypt a single value
     */
    async encryptValue(value: string): Promise<string> {
        if (!value) return value;
        const key = await this.getKey();
        return encrypt(value, key);
    }

    /**
     * Decrypt a single value
     */
    async decryptValue(value: string): Promise<string> {
        if (!value || !isEncrypted(value)) return value;
        const key = await this.getKey();
        try {
            return await decrypt(value, key);
        } catch (e) {
            console.warn('Decryption failed, returning original value');
            return value;
        }
    }

    /**
     * Encrypt sensitive fields in an expense object
     */
    async encryptExpenseFields(expense: {
        merchant?: {
            nip?: string;
            address?: string;
        };
        receiptNumber?: string;
        notes?: string;
    }): Promise<typeof expense> {
        const result = { ...expense };
        const key = await this.getKey();

        if (result.merchant) {
            result.merchant = { ...result.merchant };
            if (result.merchant.nip) {
                result.merchant.nip = await encrypt(result.merchant.nip, key);
            }
            if (result.merchant.address) {
                result.merchant.address = await encrypt(result.merchant.address, key);
            }
        }
        if (result.receiptNumber) {
            result.receiptNumber = await encrypt(result.receiptNumber, key);
        }
        if (result.notes) {
            result.notes = await encrypt(result.notes, key);
        }

        return result;
    }

    /**
     * Decrypt sensitive fields in an expense object
     */
    async decryptExpenseFields(expense: {
        merchant?: {
            nip?: string;
            address?: string;
        };
        receiptNumber?: string;
        notes?: string;
    }): Promise<typeof expense> {
        const result = { ...expense };
        const key = await this.getKey();

        if (result.merchant) {
            result.merchant = { ...result.merchant };
            if (result.merchant.nip && isEncrypted(result.merchant.nip)) {
                try {
                    result.merchant.nip = await decrypt(result.merchant.nip, key);
                } catch { /* keep encrypted */ }
            }
            if (result.merchant.address && isEncrypted(result.merchant.address)) {
                try {
                    result.merchant.address = await decrypt(result.merchant.address, key);
                } catch { /* keep encrypted */ }
            }
        }
        if (result.receiptNumber && isEncrypted(result.receiptNumber)) {
            try {
                result.receiptNumber = await decrypt(result.receiptNumber, key);
            } catch { /* keep encrypted */ }
        }
        if (result.notes && isEncrypted(result.notes)) {
            try {
                result.notes = await decrypt(result.notes, key);
            } catch { /* keep encrypted */ }
        }

        return result;
    }

    /**
     * Check if crypto service is ready
     */
    isReady(): boolean {
        return this.key !== null;
    }

    /**
     * Clear stored key (on logout)
     */
    clearKey(userId: string): void {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(`${KEY_STORAGE_KEY}_${userId}`);
        }
        this.key = null;
        this.initPromise = null;
    }
}

export const cryptoService = new CryptoService();
export { isEncrypted };
