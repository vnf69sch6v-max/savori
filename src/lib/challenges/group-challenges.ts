/**
 * Savori Group Challenges Service
 * Competitive challenges with friends
 */

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============ TYPES ============

export type GroupChallengeType =
    | 'savings_race'      // Who saves the most
    | 'expense_reduction' // Who reduces spending the most
    | 'streak_battle'     // Longest streak wins
    | 'scan_marathon';    // Most receipts scanned

export interface GroupChallenge {
    id: string;
    name: string;
    description: string;
    emoji: string;
    type: GroupChallengeType;
    creatorId: string;
    creatorName: string;
    participants: string[];
    participantNames: Record<string, string>;
    invitedUsers: string[];
    startDate: Timestamp;
    endDate: Timestamp;
    status: 'pending' | 'active' | 'completed';
    goal?: number; // Target amount/count depending on type
    progress: Record<string, number>; // userId -> progress
    winner?: string;
    createdAt: Timestamp;
}

export interface GroupChallengeInput {
    name: string;
    description: string;
    type: GroupChallengeType;
    durationDays: number;
    goal?: number;
    invitedUserIds: string[];
}

// ============ CHALLENGE TEMPLATES ============

export const CHALLENGE_TEMPLATES: Array<{
    type: GroupChallengeType;
    name: string;
    emoji: string;
    description: string;
    defaultGoal?: number;
}> = [
        {
            type: 'savings_race',
            name: 'Wyścig oszczędzania',
            emoji: '💰',
            description: 'Kto zaoszczędzi najwięcej w danym okresie?',
            defaultGoal: 50000, // 500 PLN
        },
        {
            type: 'expense_reduction',
            name: 'Redukcja wydatków',
            emoji: '📉',
            description: 'Kto najbardziej zmniejszy wydatki vs poprzedni okres?',
        },
        {
            type: 'streak_battle',
            name: 'Bitwa o streak',
            emoji: '🔥',
            description: 'Kto utrzyma najdłuższy streak aktywności?',
        },
        {
            type: 'scan_marathon',
            name: 'Maraton skanowania',
            emoji: '📸',
            description: 'Kto zeskanuje najwięcej paragonów?',
            defaultGoal: 30,
        },
    ];

// ============ GROUP CHALLENGES SERVICE ============

class GroupChallengesService {

    /**
     * Create a new group challenge
     */
    async createChallenge(
        creatorId: string,
        creatorName: string,
        input: GroupChallengeInput
    ): Promise<{ success: boolean; challengeId?: string; error?: string }> {
        try {
            const template = CHALLENGE_TEMPLATES.find(t => t.type === input.type);
            if (!template) {
                return { success: false, error: 'Nieznany typ wyzwania' };
            }

            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + input.durationDays);

            const challengeData: Omit<GroupChallenge, 'id'> = {
                name: input.name || template.name,
                description: input.description || template.description,
                emoji: template.emoji,
                type: input.type,
                creatorId,
                creatorName,
                participants: [creatorId],
                participantNames: { [creatorId]: creatorName },
                invitedUsers: input.invitedUserIds,
                startDate: Timestamp.fromDate(now),
                endDate: Timestamp.fromDate(endDate),
                status: 'pending',
                goal: input.goal || template.defaultGoal,
                progress: { [creatorId]: 0 },
                createdAt: Timestamp.now(),
            };

            const docRef = await addDoc(collection(db, 'group_challenges'), challengeData);

            return { success: true, challengeId: docRef.id };
        } catch (error) {
            console.error('Create group challenge error:', error);
            return { success: false, error: 'Błąd tworzenia wyzwania' };
        }
    }

    /**
     * Join a group challenge
     */
    async joinChallenge(
        challengeId: string,
        userId: string,
        userName: string
    ): Promise<boolean> {
        try {
            const challengeRef = doc(db, 'group_challenges', challengeId);
            const challengeSnap = await getDoc(challengeRef);

            if (!challengeSnap.exists()) return false;

            const challenge = challengeSnap.data() as GroupChallenge;

            // Check if already participating
            if (challenge.participants.includes(userId)) return true;

            // Check if invited or open
            if (!challenge.invitedUsers.includes(userId) && challenge.invitedUsers.length > 0) {
                return false; // Not invited
            }

            await updateDoc(challengeRef, {
                participants: arrayUnion(userId),
                [`participantNames.${userId}`]: userName,
                [`progress.${userId}`]: 0,
                invitedUsers: arrayRemove(userId),
            });

            return true;
        } catch (error) {
            console.error('Join challenge error:', error);
            return false;
        }
    }

    /**
     * Leave a group challenge
     */
    async leaveChallenge(challengeId: string, userId: string): Promise<boolean> {
        try {
            const challengeRef = doc(db, 'group_challenges', challengeId);

            await updateDoc(challengeRef, {
                participants: arrayRemove(userId),
            });

            return true;
        } catch (error) {
            console.error('Leave challenge error:', error);
            return false;
        }
    }

    /**
     * Update progress for a participant
     */
    async updateProgress(
        challengeId: string,
        userId: string,
        progress: number
    ): Promise<boolean> {
        try {
            const challengeRef = doc(db, 'group_challenges', challengeId);

            await updateDoc(challengeRef, {
                [`progress.${userId}`]: progress,
            });

            return true;
        } catch (error) {
            console.error('Update progress error:', error);
            return false;
        }
    }

    /**
     * Start a pending challenge
     */
    async startChallenge(challengeId: string, creatorId: string): Promise<boolean> {
        try {
            const challengeRef = doc(db, 'group_challenges', challengeId);
            const challengeSnap = await getDoc(challengeRef);

            if (!challengeSnap.exists()) return false;

            const challenge = challengeSnap.data() as GroupChallenge;
            if (challenge.creatorId !== creatorId) return false;

            await updateDoc(challengeRef, {
                status: 'active',
                startDate: Timestamp.now(),
            });

            return true;
        } catch (error) {
            console.error('Start challenge error:', error);
            return false;
        }
    }

    /**
     * Complete a challenge and determine winner
     */
    async completeChallenge(challengeId: string): Promise<string | null> {
        try {
            const challengeRef = doc(db, 'group_challenges', challengeId);
            const challengeSnap = await getDoc(challengeRef);

            if (!challengeSnap.exists()) return null;

            const challenge = challengeSnap.data() as GroupChallenge;

            // Determine winner (highest progress)
            let winner: string | null = null;
            let highestProgress = -Infinity;

            Object.entries(challenge.progress).forEach(([userId, prog]) => {
                if (prog > highestProgress) {
                    highestProgress = prog;
                    winner = userId;
                }
            });

            await updateDoc(challengeRef, {
                status: 'completed',
                winner,
            });

            return winner;
        } catch (error) {
            console.error('Complete challenge error:', error);
            return null;
        }
    }

    /**
     * Get user's group challenges
     */
    async getUserChallenges(userId: string): Promise<GroupChallenge[]> {
        try {
            const challengesRef = collection(db, 'group_challenges');
            const q = query(
                challengesRef,
                where('participants', 'array-contains', userId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GroupChallenge[];
        } catch (error) {
            console.error('Get user challenges error:', error);
            return [];
        }
    }

    /**
     * Get pending invitations for user
     */
    async getPendingInvitations(userId: string): Promise<GroupChallenge[]> {
        try {
            const challengesRef = collection(db, 'group_challenges');
            const q = query(
                challengesRef,
                where('invitedUsers', 'array-contains', userId),
                where('status', '==', 'pending')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as GroupChallenge[];
        } catch (error) {
            console.error('Get invitations error:', error);
            return [];
        }
    }

    /**
     * Get leaderboard for a challenge
     */
    async getChallengeLeaderboard(challengeId: string): Promise<Array<{
        userId: string;
        name: string;
        progress: number;
        rank: number;
    }>> {
        try {
            const challengeRef = doc(db, 'group_challenges', challengeId);
            const challengeSnap = await getDoc(challengeRef);

            if (!challengeSnap.exists()) return [];

            const challenge = challengeSnap.data() as GroupChallenge;

            const leaderboard = Object.entries(challenge.progress)
                .map(([userId, progress]) => ({
                    userId,
                    name: challenge.participantNames[userId] || 'Unknown',
                    progress,
                    rank: 0,
                }))
                .sort((a, b) => b.progress - a.progress);

            // Assign ranks
            leaderboard.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            return leaderboard;
        } catch (error) {
            console.error('Get leaderboard error:', error);
            return [];
        }
    }
}

// Singleton export
export const groupChallengesService = new GroupChallengesService();
