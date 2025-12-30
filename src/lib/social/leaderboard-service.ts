/**
 * Savori Leaderboard Service
 * Global and friends leaderboards
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit as firestoreLimit,
    where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============ TYPES ============

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    photoURL?: string;
    xp: number;
    level: number;
    streak: number;
    rank?: number;
}

export type LeaderboardType = 'xp' | 'streak' | 'level';

// ============ LEADERBOARD SERVICE ============

class LeaderboardService {

    /**
     * Get global leaderboard (top users by XP)
     */
    async getGlobalLeaderboard(limitCount = 100, type: LeaderboardType = 'xp'): Promise<LeaderboardEntry[]> {
        try {
            const usersRef = collection(db, 'users');

            // Query users with gamification data, sorted by XP
            const q = query(
                usersRef,
                orderBy(`gamification.${type === 'streak' ? 'currentStreak' : type}`, 'desc'),
                firestoreLimit(limitCount)
            );

            const snapshot = await getDocs(q);

            const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
                const data = doc.data();
                const gamification = data.gamification || {};

                return {
                    userId: doc.id,
                    displayName: data.displayName || 'Użytkownik',
                    photoURL: data.photoURL || null,
                    xp: gamification.xp || 0,
                    level: gamification.level || 1,
                    streak: gamification.currentStreak || 0,
                    rank: index + 1,
                };
            });

            return entries;
        } catch (error) {
            console.error('Error getting global leaderboard:', error);
            return [];
        }
    }

    /**
     * Get friends leaderboard
     */
    async getFriendsLeaderboard(userId: string, type: LeaderboardType = 'xp'): Promise<LeaderboardEntry[]> {
        try {
            // Get user's friends
            const friendsRef = collection(db, 'users', userId, 'friends');
            const friendsSnap = await getDocs(friendsRef);

            const friendIds = friendsSnap.docs.map(doc => doc.id);

            // Add current user to the list
            friendIds.push(userId);

            // Fetch all users' data
            const entries: LeaderboardEntry[] = [];

            for (const id of friendIds) {
                const userDoc = await getDoc(doc(db, 'users', id));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const gamification = data.gamification || {};

                    entries.push({
                        userId: id,
                        displayName: data.displayName || 'Użytkownik',
                        photoURL: data.photoURL || null,
                        xp: gamification.xp || 0,
                        level: gamification.level || 1,
                        streak: gamification.currentStreak || 0,
                    });
                }
            }

            // Sort by selected type
            const sortKey = type === 'streak' ? 'streak' : type;
            entries.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));

            // Add ranks
            entries.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            return entries;
        } catch (error) {
            console.error('Error getting friends leaderboard:', error);
            return [];
        }
    }

    /**
     * Get user's global rank
     */
    async getUserRank(userId: string, type: LeaderboardType = 'xp'): Promise<number | null> {
        try {
            // Get user's XP
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) return null;

            const userData = userDoc.data();
            const userValue = type === 'streak'
                ? userData.gamification?.currentStreak || 0
                : userData.gamification?.[type] || 0;

            // Count users with higher XP
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where(`gamification.${type === 'streak' ? 'currentStreak' : type}`, '>', userValue)
            );

            const snapshot = await getDocs(q);
            return snapshot.size + 1; // +1 because rank starts at 1
        } catch (error) {
            console.error('Error getting user rank:', error);
            return null;
        }
    }

    /**
     * Get leaderboard summary for dashboard
     */
    async getLeaderboardSummary(userId: string): Promise<{
        globalRank: number | null;
        friendsRank: number | null;
        topFriends: LeaderboardEntry[];
    }> {
        try {
            const [globalRank, friendsLeaderboard] = await Promise.all([
                this.getUserRank(userId),
                this.getFriendsLeaderboard(userId)
            ]);

            const userEntry = friendsLeaderboard.find(e => e.userId === userId);
            const friendsRank = userEntry?.rank || null;

            return {
                globalRank,
                friendsRank,
                topFriends: friendsLeaderboard.slice(0, 5),
            };
        } catch (error) {
            console.error('Error getting leaderboard summary:', error);
            return {
                globalRank: null,
                friendsRank: null,
                topFriends: [],
            };
        }
    }
}

// Singleton export
export const leaderboardService = new LeaderboardService();
