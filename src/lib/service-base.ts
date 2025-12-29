/**
 * Savori Service Base
 * Base class for all service modules with common functionality
 */

import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    QueryConstraint,
    DocumentData,
    Timestamp,
    CollectionReference
} from 'firebase/firestore';

export abstract class BaseService<T extends { id: string }> {
    protected collectionPath: string;

    constructor(collectionPath: string) {
        this.collectionPath = collectionPath;
    }

    /**
     * Get collection reference for a user
     */
    protected getCollectionRef(userId: string): CollectionReference {
        return collection(db, 'users', userId, this.collectionPath);
    }

    /**
     * Get a document by ID
     */
    async getById(userId: string, docId: string): Promise<T | null> {
        const ref = doc(db, 'users', userId, this.collectionPath, docId);
        const snap = await getDoc(ref);

        if (!snap.exists()) return null;

        return { id: snap.id, ...snap.data() } as T;
    }

    /**
     * Get all documents with optional constraints
     */
    async getAll(userId: string, constraints: QueryConstraint[] = []): Promise<T[]> {
        const ref = this.getCollectionRef(userId);
        const q = query(ref, ...constraints);
        const snap = await getDocs(q);

        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
    }

    /**
     * Create a new document
     */
    async create(userId: string, data: Omit<T, 'id'>): Promise<string> {
        const ref = this.getCollectionRef(userId);
        const docRef = await addDoc(ref, {
            ...data,
            createdAt: Timestamp.now(),
        });

        return docRef.id;
    }

    /**
     * Update a document
     */
    async update(userId: string, docId: string, data: Partial<T>): Promise<void> {
        const ref = doc(db, 'users', userId, this.collectionPath, docId);
        await updateDoc(ref, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    }

    /**
     * Delete a document
     */
    async delete(userId: string, docId: string): Promise<void> {
        const ref = doc(db, 'users', userId, this.collectionPath, docId);
        await deleteDoc(ref);
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(
        userId: string,
        callback: (items: T[]) => void,
        constraints: QueryConstraint[] = []
    ): () => void {
        const ref = this.getCollectionRef(userId);
        const q = query(ref, ...constraints);

        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
            callback(items);
        });
    }
}

/**
 * Cache utilities
 */
export class CacheManager {
    private cache: Map<string, { data: unknown; expires: number }> = new Map();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes

    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        return item.data as T;
    }

    set<T>(key: string, data: T, ttl = this.defaultTTL): void {
        this.cache.set(key, { data, expires: Date.now() + ttl });
    }

    invalidate(pattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }
}

export const cache = new CacheManager();

/**
 * Utility types for service responses
 */
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export function success<T>(data: T): ServiceResult<T> {
    return { success: true, data };
}

export function failure<T>(error: string): ServiceResult<T> {
    return { success: false, error };
}

/**
 * Date range utilities
 */
export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

export function getDayRange(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}
