/**
 * Savori Event Bus
 * Centralny system eventów do komunikacji między modułami
 */

export type EventType =
    // Expense events
    | 'expense:added'
    | 'expense:updated'
    | 'expense:deleted'
    // Budget events
    | 'budget:created'
    | 'budget:updated'
    | 'budget:exceeded'
    | 'budget:warning'
    // Goal events
    | 'goal:created'
    | 'goal:updated'
    | 'goal:completed'
    | 'goal:contribution'
    // Gamification events
    | 'streak:continued'
    | 'streak:broken'
    | 'achievement:unlocked'
    | 'level:up'
    | 'points:awarded'
    // Challenge events
    | 'challenge:started'
    | 'challenge:completed'
    | 'challenge:failed'
    // AI events
    | 'ai:insight_generated'
    | 'ai:anomaly_detected'
    | 'ai:prediction_updated';

export interface EventPayload {
    'expense:added': { expense: { id: string; amount: number; category: string; merchant: string }; userId: string };
    'expense:updated': { expenseId: string; changes: Record<string, unknown>; userId: string };
    'expense:deleted': { expenseId: string; userId: string };
    'budget:created': { budgetId: string; month: string; limit: number; userId: string };
    'budget:updated': { budgetId: string; changes: Record<string, unknown>; userId: string };
    'budget:exceeded': { budgetId: string; spent: number; limit: number; userId: string };
    'budget:warning': { budgetId: string; utilization: number; userId: string };
    'goal:created': { goalId: string; name: string; target: number; userId: string };
    'goal:updated': { goalId: string; changes: Record<string, unknown>; userId: string };
    'goal:completed': { goalId: string; name: string; totalSaved: number; userId: string };
    'goal:contribution': { goalId: string; amount: number; source: string; userId: string };
    'streak:continued': { streak: number; userId: string };
    'streak:broken': { previousStreak: number; userId: string };
    'achievement:unlocked': { achievementId: string; name: string; userId: string };
    'level:up': { newLevel: number; previousLevel: number; userId: string };
    'points:awarded': { points: number; reason: string; userId: string };
    'challenge:started': { challengeId: string; name: string; userId: string };
    'challenge:completed': { challengeId: string; name: string; reward: number; userId: string };
    'challenge:failed': { challengeId: string; name: string; userId: string };
    'ai:insight_generated': { insights: string[]; userId: string };
    'ai:anomaly_detected': { expenseId: string; severity: string; reason: string; userId: string };
    'ai:prediction_updated': { predictedTotal: number; willExceed: boolean; userId: string };
}

type EventHandler<T extends EventType> = (payload: EventPayload[T]) => void | Promise<void>;

class EventBus {
    private handlers: Map<EventType, Set<EventHandler<EventType>>> = new Map();
    private history: Array<{ type: EventType; payload: unknown; timestamp: Date }> = [];

    /**
     * Subscribe to an event
     */
    on<T extends EventType>(event: T, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler as EventHandler<EventType>);

        // Return unsubscribe function
        return () => {
            this.handlers.get(event)?.delete(handler as EventHandler<EventType>);
        };
    }

    /**
     * Emit an event
     */
    async emit<T extends EventType>(event: T, payload: EventPayload[T]): Promise<void> {
        // Log to history
        this.history.push({ type: event, payload, timestamp: new Date() });
        if (this.history.length > 100) {
            this.history.shift();
        }

        // Call handlers
        const handlers = this.handlers.get(event);
        if (!handlers) return;

        const promises = Array.from(handlers).map(handler => {
            try {
                return Promise.resolve(handler(payload as EventPayload[EventType]));
            } catch (error) {
                console.error(`Event handler error for ${event}:`, error);
                return Promise.resolve();
            }
        });

        await Promise.all(promises);
    }

    /**
     * Get recent event history
     */
    getHistory(limit = 20): Array<{ type: EventType; payload: unknown; timestamp: Date }> {
        return this.history.slice(-limit);
    }

    /**
     * Clear all handlers
     */
    clear(): void {
        this.handlers.clear();
    }
}

// Singleton instance
export const eventBus = new EventBus();

// Console logging in development
if (process.env.NODE_ENV === 'development') {
    const logEvent = (type: EventType) => (payload: unknown) => {
        console.log(`📢 [Event] ${type}`, payload);
    };

    const eventsToLog: EventType[] = [
        'expense:added',
        'budget:exceeded',
        'goal:completed',
        'achievement:unlocked',
        'level:up',
        'challenge:completed',
    ];

    eventsToLog.forEach(event => {
        eventBus.on(event, logEvent(event));
    });
}
