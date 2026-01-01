
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { notificationService } from '@/lib/engagement/notifications';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { userData } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userData?.id) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const notificationsRef = collection(db, 'users', userData.id, 'notifications');
        const q = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            limit(20) // Reduced from 50 to save reads
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: Notification[] = [];
            let unread = 0;

            snapshot.forEach((doc) => {
                const data = doc.data() as Omit<Notification, 'id'>;
                items.push({ id: doc.id, ...data });
                if (!data.read) unread++;
            });

            setNotifications(items);
            setUnreadCount(unread);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    const markAsRead = async (id: string) => {
        if (!userData?.id) return;
        await notificationService.markAsRead(userData.id, id);
    };

    const markAllAsRead = async () => {
        if (!userData?.id) return;

        // Optimistic update
        const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updatedNotifications);
        setUnreadCount(0);

        await notificationService.markAllAsRead(userData.id);
    };

    const deleteNotification = async (id: string) => {
        if (!userData?.id) return;
        await notificationService.delete(userData.id, id);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
