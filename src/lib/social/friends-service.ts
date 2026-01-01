/**
 * Savori Friends Service
 * Social features - friend management
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
    onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============ TYPES ============

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserPhoto?: string;
    toUserId: string;
    toUserEmail: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Timestamp;
}

export interface Friend {
    id: string;
    displayName: string;
    photoURL?: string;
    since: Timestamp;
    // Cached stats for leaderboard
    xp?: number;
    level?: number;
    streak?: number;
}

// ============ FRIENDS SERVICE ============

class FriendsService {

    /**
     * Send a friend request by email
     */
    async sendFriendRequest(fromUserId: string, fromUserName: string, toEmail: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Find user by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', toEmail.toLowerCase().trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { success: false, error: 'Nie znaleziono użytkownika o tym adresie email' };
            }

            const targetUser = snapshot.docs[0];
            const targetUserId = targetUser.id;

            // Can't friend yourself
            if (targetUserId === fromUserId) {
                return { success: false, error: 'Nie możesz dodać siebie jako znajomego' };
            }

            // Check if already friends
            const friendRef = doc(db, 'users', fromUserId, 'friends', targetUserId);
            const friendSnap = await getDoc(friendRef);
            if (friendSnap.exists()) {
                return { success: false, error: 'Ta osoba jest już Twoim znajomym' };
            }

            // Check if request already exists
            const requestsRef = collection(db, 'friend_requests');
            const existingQuery = query(
                requestsRef,
                where('fromUserId', '==', fromUserId),
                where('toUserId', '==', targetUserId),
                where('status', '==', 'pending')
            );
            const existingSnap = await getDocs(existingQuery);
            if (!existingSnap.empty) {
                return { success: false, error: 'Zaproszenie już zostało wysłane' };
            }

            // Check if reverse request exists (they sent us one)
            const reverseQuery = query(
                requestsRef,
                where('fromUserId', '==', targetUserId),
                where('toUserId', '==', fromUserId),
                where('status', '==', 'pending')
            );
            const reverseSnap = await getDocs(reverseQuery);
            if (!reverseSnap.empty) {
                // Auto-accept the reverse request
                await this.acceptFriendRequest(reverseSnap.docs[0].id, fromUserId);
                return { success: true };
            }

            // Create friend request
            const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
            const fromUserData = fromUserDoc.data();

            await addDoc(requestsRef, {
                fromUserId,
                fromUserName: fromUserName,
                fromUserPhoto: fromUserData?.photoURL || null,
                toUserId: targetUserId,
                toUserEmail: toEmail.toLowerCase().trim(),
                status: 'pending',
                createdAt: Timestamp.now(),
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { success: false, error: 'Wystąpił błąd podczas wysyłania zaproszenia' };
        }
    }

    /**
     * Accept a friend request
     */
    async acceptFriendRequest(requestId: string, currentUserId: string): Promise<boolean> {
        try {
            const requestRef = doc(db, 'friend_requests', requestId);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) return false;

            const request = requestSnap.data() as Omit<FriendRequest, 'id'>;

            // Verify current user is the recipient
            if (request.toUserId !== currentUserId) return false;

            // Get both users' data
            const fromUserDoc = await getDoc(doc(db, 'users', request.fromUserId));
            const toUserDoc = await getDoc(doc(db, 'users', currentUserId));

            const fromUserData = fromUserDoc.data();
            const toUserData = toUserDoc.data();

            const batch = writeBatch(db);

            // Update request status
            batch.update(requestRef, { status: 'accepted' });

            // Add friend to sender's list
            const senderFriendRef = doc(db, 'users', request.fromUserId, 'friends', currentUserId);
            batch.set(senderFriendRef, {
                displayName: toUserData?.displayName || 'Użytkownik',
                photoURL: toUserData?.photoURL || null,
                since: Timestamp.now(),
                xp: toUserData?.gamification?.xp || 0,
                level: toUserData?.gamification?.level || 1,
            });

            // Add friend to receiver's list
            const receiverFriendRef = doc(db, 'users', currentUserId, 'friends', request.fromUserId);
            batch.set(receiverFriendRef, {
                displayName: fromUserData?.displayName || request.fromUserName,
                photoURL: fromUserData?.photoURL || request.fromUserPhoto || null,
                since: Timestamp.now(),
                xp: fromUserData?.gamification?.xp || 0,
                level: fromUserData?.gamification?.level || 1,
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return false;
        }
    }

    /**
     * Reject a friend request
     */
    async rejectFriendRequest(requestId: string, currentUserId: string): Promise<boolean> {
        try {
            const requestRef = doc(db, 'friend_requests', requestId);
            const requestSnap = await getDoc(requestRef);

            if (!requestSnap.exists()) return false;

            const request = requestSnap.data() as Omit<FriendRequest, 'id'>;

            // Verify current user is the recipient
            if (request.toUserId !== currentUserId) return false;

            await updateDoc(requestRef, { status: 'rejected' });
            return true;
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            return false;
        }
    }

    /**
     * Get pending friend requests for user
     */
    async getPendingRequests(userId: string): Promise<FriendRequest[]> {
        try {
            const requestsRef = collection(db, 'friend_requests');
            const q = query(
                requestsRef,
                where('toUserId', '==', userId),
                where('status', '==', 'pending'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FriendRequest[];
        } catch (error) {
            console.error('Error getting pending requests:', error);
            return [];
        }
    }

    /**
     * Get user's friends list
     */
    async getFriends(userId: string): Promise<Friend[]> {
        try {
            const friendsRef = collection(db, 'users', userId, 'friends');
            const snapshot = await getDocs(friendsRef);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Friend[];
        } catch (error) {
            console.error('Error getting friends:', error);
            return [];
        }
    }

    /**
     * Subscribe to friends list (real-time)
     */
    subscribeFriends(userId: string, callback: (friends: Friend[]) => void): () => void {
        const friendsRef = collection(db, 'users', userId, 'friends');

        return onSnapshot(friendsRef, (snapshot) => {
            const friends = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Friend[];
            callback(friends);
        });
    }

    /**
     * Subscribe to pending requests (real-time)
     */
    subscribePendingRequests(userId: string, callback: (requests: FriendRequest[]) => void): () => void {
        const requestsRef = collection(db, 'friend_requests');
        const q = query(
            requestsRef,
            where('toUserId', '==', userId),
            where('status', '==', 'pending')
        );

        return onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FriendRequest[];
            callback(requests);
        });
    }

    /**
     * Remove a friend
     */
    async unfriend(userId: string, friendId: string): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            // Remove from both users' friends lists
            batch.delete(doc(db, 'users', userId, 'friends', friendId));
            batch.delete(doc(db, 'users', friendId, 'friends', userId));

            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error unfriending:', error);
            return false;
        }
    }

    /**
     * Get friend count
     */
    async getFriendCount(userId: string): Promise<number> {
        try {
            const friendsRef = collection(db, 'users', userId, 'friends');
            const snapshot = await getDocs(friendsRef);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting friend count:', error);
            return 0;
        }
    }
}

// Singleton export
export const friendsService = new FriendsService();
