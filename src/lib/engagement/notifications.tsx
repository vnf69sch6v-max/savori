'use client';

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification, NotificationType } from '@/types';
import { toast } from 'react-hot-toast';

export class NotificationService {
    /**
     * Send a notification to a user
     */
    async send(userId: string, data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'read'>) {
        try {
            const notificationsRef = collection(db, 'users', userId, 'notifications');

            // Create notification object
            const notificationData = {
                ...data,
                userId,
                read: false,
                createdAt: serverTimestamp(),
            };

            // Add to Firestore
            await addDoc(notificationsRef, notificationData);

            // Show toast
            this.showToast(data.title, data.message, data.emoji, data.type);

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(userId: string, notificationId: string) {
        try {
            const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string) {
        try {
            const notificationsRef = collection(db, 'users', userId, 'notifications');
            const q = query(notificationsRef, where('read', '==', false));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { read: true });
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }
    }

    /**
     * Delete a notification
     */
    async delete(userId: string, notificationId: string) {
        try {
            const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
            await deleteDoc(notificationRef);
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }

    /**
     * Show toast notification
     */
    private showToast(title: string, message: string, emoji?: string, type?: NotificationType) {
        const icon = emoji || this.getTypeIcon(type);

        toast(
            (t) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{title}</span>
                    <span className="text-sm text-gray-500">{message}</span>
                </div>
            ),
            {
                icon: icon,
                duration: 4000,
                style: {
                    borderRadius: '12px',
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                },
            }
        );
    }

    private getTypeIcon(type?: NotificationType): string {
        switch (type) {
            case 'achievement': return '🏆';
            case 'streak_warning': return '🔥';
            case 'streak_restored': return '⚡';
            case 'budget_alert': return '⚠️';
            case 'insight': return '💡';
            case 'daily_reminder': return '📅';
            case 'system': return '🔔';
            default: return '🔔';
        }
    }
}

export const notificationService = new NotificationService();
