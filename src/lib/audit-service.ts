import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type AuditActionType =
    | 'EXPENSE_CREATE'
    | 'EXPENSE_UPDATE'
    | 'EXPENSE_DELETE'
    | 'BUDGET_UPDATE'
    | 'GOAL_CREATE'
    | 'GOAL_UPDATE'
    | 'SUBSCRIPTION_DETECTED'
    | 'LOGIN_ANOMALY';

export interface AuditLogEntry {
    userId: string;
    action: AuditActionType;
    entity: string; // e.g., 'expense', 'budget'
    entityId?: string;
    details?: Record<string, any>;
    createdAt: any;
    ipHash?: string; // Optional for security
    userAgent?: string;
}

export const AuditService = {
    /**
     * Logs a critical action to the immutable transaction_events collection.
     * This collection is protected by Firestore Rules to be Append-Only.
     */
    async logAction(
        userId: string,
        action: AuditActionType,
        entity: string,
        entityId?: string,
        details?: Record<string, any>
    ) {
        try {
            if (!userId) {
                console.warn('AuditService: No userId provided, skipping log');
                return;
            }

            const entry: AuditLogEntry = {
                userId,
                action,
                entity,
                entityId,
                details: details || {},
                createdAt: serverTimestamp(),
                // In a real app, we might capture IP/UA here or pass it in
            };

            await addDoc(collection(db, 'transaction_events'), entry);
            console.log(`[AUDIT] Action logged: ${action} on ${entity}/${entityId}`);
        } catch (error) {
            // Audit logging should not break the app flow, but it should be reported
            console.error('AuditService Error:', error);
            // In a high-security context, we might want to throw here to ABORT the transaction
            // but for Savori we will just log the error.
        }
    }
};
