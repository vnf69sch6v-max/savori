import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type SecurityEventType =
    | 'login'
    | 'logout'
    | 'password_change'
    | 'new_device'
    | 'receipt_scan'
    | 'goal_created'
    | 'goal_completed'
    | 'expense_added'
    | 'settings_changed'
    | 'suspicious';

interface SecurityEventData {
    type: SecurityEventType;
    description: string;
    success?: boolean;
    metadata?: Record<string, unknown>;
}

/**
 * Get device and browser info from user agent
 */
export function getDeviceInfo(): { device: string; browser: string } {
    if (typeof navigator === 'undefined') {
        return { device: 'Server', browser: 'N/A' };
    }

    const ua = navigator.userAgent;
    let device = 'Nieznane urządzenie';
    let browser = 'Nieznana przeglądarka';

    // Detect device
    if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('iPad')) device = 'iPad';
    else if (ua.includes('Android')) {
        if (ua.includes('Mobile')) device = 'Android Phone';
        else device = 'Android Tablet';
    }
    else if (ua.includes('Mac')) device = 'Mac';
    else if (ua.includes('Windows')) device = 'Windows PC';
    else if (ua.includes('Linux')) device = 'Linux';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edge')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';

    return { device, browser };
}

/**
 * Log a security event to Firestore
 */
export async function logSecurityEvent(
    userId: string,
    data: SecurityEventData
): Promise<void> {
    if (!userId) {
        console.warn('Cannot log security event: no userId');
        return;
    }

    try {
        const { device, browser } = getDeviceInfo();

        await addDoc(collection(db, 'users', userId, 'securityEvents'), {
            type: data.type,
            description: data.description,
            timestamp: Timestamp.now(),
            device: `${device}, ${browser}`,
            location: 'Polska', // Could use geolocation API
            success: data.success ?? true,
            metadata: data.metadata ?? {},
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
        // Don't throw - logging should not break the app
    }
}

/**
 * Predefined security events for common actions
 */
export const SecurityEvents = {
    login: (method: 'email' | 'google' = 'email') => ({
        type: 'login' as const,
        description: `Zalogowano przez ${method === 'google' ? 'Google' : 'email'}`,
    }),

    logout: () => ({
        type: 'logout' as const,
        description: 'Wylogowano z konta',
    }),

    receiptScan: (merchantName: string, amount: number) => ({
        type: 'receipt_scan' as const,
        description: `Zeskanowano paragon: ${merchantName}`,
        metadata: { amount },
    }),

    expenseAdded: (merchantName: string, amount: number) => ({
        type: 'expense_added' as const,
        description: `Dodano wydatek: ${merchantName}`,
        metadata: { amount },
    }),

    goalCreated: (goalName: string) => ({
        type: 'goal_created' as const,
        description: `Utworzono cel: ${goalName}`,
    }),

    goalCompleted: (goalName: string) => ({
        type: 'goal_completed' as const,
        description: `Ukończono cel: ${goalName}`,
    }),

    settingsChanged: (setting: string) => ({
        type: 'settings_changed' as const,
        description: `Zmieniono ustawienia: ${setting}`,
    }),

    passwordChanged: () => ({
        type: 'password_change' as const,
        description: 'Zmieniono hasło',
    }),

    newDevice: () => ({
        type: 'new_device' as const,
        description: 'Logowanie z nowego urządzenia',
    }),

    suspiciousActivity: (reason: string) => ({
        type: 'suspicious' as const,
        description: `Podejrzana aktywność: ${reason}`,
        success: false,
    }),
};
