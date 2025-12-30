'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Flame,
    Target,
    Clock,
    CheckCircle,
    XCircle,
    Play,
    Loader2,
    Sparkles,
    Gift,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
    AVAILABLE_CHALLENGES,
    Challenge,
    UserChallenge,
    getDifficultyColor,
    getDifficultyLabel,
} from '@/lib/challenges';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { addDays, differenceInDays, format } from 'date-fns';
import { engagementService } from '@/lib/engagement/xp-system';

export default function ChallengesPage() {
    const { userData } = useAuth();
    const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<UserChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

    // Fetch user's challenges
    useEffect(() => {
        if (!userData?.id) {
            setTimeout(() => setLoading(false), 0);
            return;
        }

        const fetchChallenges = async () => {
            const challengesRef = collection(db, 'users', userData.id, 'challenges');
            const snapshot = await getDocs(challengesRef);
            const userChallenges = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserChallenge[];

            setActiveChallenges(userChallenges.filter(c => c.status === 'active'));
            setCompletedChallenges(userChallenges.filter(c => c.status === 'completed' || c.status === 'failed'));
            setLoading(false);
        };

        fetchChallenges();
    }, [userData?.id]);

    // Start a challenge
    const startChallenge = async (challenge: Challenge) => {
        if (!userData?.id) return;

        // Check if already active
        if (activeChallenges.some(c => c.challengeId === challenge.id)) {
            toast.error('To wyzwanie jest już aktywne!');
            return;
        }

        try {
            const now = new Date();
            const endDate = addDays(now, challenge.duration);

            const userChallenge: Omit<UserChallenge, 'id'> = {
                challengeId: challenge.id,
                userId: userData.id,
                startDate: Timestamp.fromDate(now),
                endDate: Timestamp.fromDate(endDate),
                status: 'active',
                progress: 0,
            };

            const docRef = await addDoc(
                collection(db, 'users', userData.id, 'challenges'),
                userChallenge
            );

            setActiveChallenges([...activeChallenges, { id: docRef.id, ...userChallenge }]);
            toast.success(`🎯 Rozpoczęto wyzwanie: ${challenge.name}!`);
        } catch (error) {
            console.error('Start challenge error:', error);
            toast.error('Nie udało się rozpocząć wyzwania');
        }
    };

    // Complete a challenge (for demo purposes)
    const completeChallenge = async (userChallenge: UserChallenge) => {
        if (!userData?.id) return;

        const challenge = AVAILABLE_CHALLENGES.find(c => c.id === userChallenge.challengeId);
        if (!challenge) return;

        try {
            await updateDoc(doc(db, 'users', userData.id, 'challenges', userChallenge.id), {
                status: 'completed',
                progress: 100,
                completedAt: Timestamp.now(),
            });

            // Award points
            await engagementService.awardCustomXP(userData.id, challenge.reward.points, `Ukończono wyzwanie: ${challenge.name}`);

            setActiveChallenges(activeChallenges.filter(c => c.id !== userChallenge.id));
            setCompletedChallenges([
                ...completedChallenges,
                { ...userChallenge, status: 'completed', progress: 100 },
            ]);

            toast.success(`🏆 Wyzwanie ukończone! +${challenge.reward.points} punktów!`);
        } catch (error) {
            console.error('Complete challenge error:', error);
        }
    };

    // Filter challenges
    const filteredChallenges = filter === 'all'
        ? AVAILABLE_CHALLENGES
        : AVAILABLE_CHALLENGES.filter(c => c.difficulty === filter);

    const activeChallengeIds = activeChallenges.map(c => c.challengeId);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Wyzwania</h1>
                    <p className="text-slate-400">Podejmij wyzwanie, zdobądź nagrody!</p>
                </div>
            </div>

            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-400" />
                        Aktywne wyzwania ({activeChallenges.length})
                    </h2>
                    <div className="space-y-4">
                        {activeChallenges.map((uc) => {
                            const challenge = AVAILABLE_CHALLENGES.find(c => c.id === uc.challengeId);
                            if (!challenge) return null;

                            const endDate = uc.endDate.toDate();
                            const daysLeft = Math.max(0, differenceInDays(endDate, new Date()));
                            const totalDays = challenge.duration;
                            const progress = ((totalDays - daysLeft) / totalDays) * 100;

                            return (
                                <motion.div
                                    key={uc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="text-4xl">{challenge.emoji}</div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold">{challenge.name}</h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(challenge.difficulty)}`}>
                                                            {getDifficultyLabel(challenge.difficulty)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 mb-3">{challenge.description}</p>

                                                    {/* Progress bar */}
                                                    <div className="mb-2">
                                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                            <span>Postęp</span>
                                                            <span>{daysLeft} dni pozostało</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${progress}%` }}
                                                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-sm text-amber-400">
                                                            <Gift className="w-4 h-4" />
                                                            +{challenge.reward.points} punktów
                                                        </div>
                                                        <Button size="sm" onClick={() => completeChallenge(uc)}>
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Ukończ (demo)
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Difficulty Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                        key={diff}
                        onClick={() => setFilter(diff)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === diff
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {diff === 'all' ? 'Wszystkie' : getDifficultyLabel(diff)}
                    </button>
                ))}
            </div>

            {/* Available Challenges */}
            <h2 className="text-lg font-semibold mb-4">Dostępne wyzwania</h2>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {filteredChallenges.map((challenge, i) => {
                        const isActive = activeChallengeIds.includes(challenge.id);

                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className={`h-full ${isActive ? 'opacity-60' : ''}`}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-3">
                                            <div className="text-3xl">{challenge.emoji}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{challenge.name}</h3>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(challenge.difficulty)}`}>
                                                        {getDifficultyLabel(challenge.difficulty)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 mb-3">{challenge.description}</p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {challenge.duration} dni
                                                        </span>
                                                        <span className="flex items-center gap-1 text-amber-400">
                                                            <Gift className="w-3 h-3" />
                                                            +{challenge.reward.points}
                                                        </span>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant={isActive ? 'outline' : 'primary'}
                                                        disabled={isActive}
                                                        onClick={() => startChallenge(challenge)}
                                                    >
                                                        {isActive ? (
                                                            <>W trakcie</>
                                                        ) : (
                                                            <>
                                                                <Play className="w-4 h-4 mr-1" />
                                                                Start
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Completed Challenges */}
            {completedChallenges.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        Ukończone ({completedChallenges.length})
                    </h2>
                    <div className="grid md:grid-cols-3 gap-3">
                        {completedChallenges.map((uc) => {
                            const challenge = AVAILABLE_CHALLENGES.find(c => c.id === uc.challengeId);
                            if (!challenge) return null;

                            return (
                                <Card key={uc.id} className="p-4 border-emerald-500/30 bg-emerald-500/5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{challenge.emoji}</span>
                                        <div>
                                            <p className="font-medium text-sm">{challenge.name}</p>
                                            <p className="text-xs text-emerald-400">
                                                {uc.status === 'completed' ? '✅ Ukończone' : '❌ Nieukończone'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
