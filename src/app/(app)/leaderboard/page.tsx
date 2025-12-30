'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Users,
    Globe,
    Flame,
    Star,
    Loader2,
    Medal,
    Crown,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardService, LeaderboardEntry, LeaderboardType } from '@/lib/social/leaderboard-service';

export default function LeaderboardPage() {
    const { userData } = useAuth();
    const [tab, setTab] = useState<'global' | 'friends'>('global');
    const [sortBy, setSortBy] = useState<LeaderboardType>('xp');
    const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch leaderboards
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const [global, userGlobalRank] = await Promise.all([
                leaderboardService.getGlobalLeaderboard(100, sortBy),
                userData?.id ? leaderboardService.getUserRank(userData.id, sortBy) : null
            ]);

            setGlobalLeaderboard(global);
            setUserRank(userGlobalRank);

            if (userData?.id) {
                const friends = await leaderboardService.getFriendsLeaderboard(userData.id, sortBy);
                setFriendsLeaderboard(friends);
            }

            setLoading(false);
        };

        fetchData();
    }, [userData?.id, sortBy]);

    const currentLeaderboard = tab === 'global' ? globalLeaderboard : friendsLeaderboard;

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
        return <span className="text-slate-400 font-medium">#{rank}</span>;
    };

    const getRankBg = (rank: number, isCurrentUser: boolean) => {
        if (isCurrentUser) return 'bg-blue-500/10 border-blue-500/30';
        if (rank === 1) return 'bg-amber-500/10 border-amber-500/30';
        if (rank === 2) return 'bg-slate-500/10 border-slate-500/30';
        if (rank === 3) return 'bg-amber-700/10 border-amber-700/30';
        return 'border-transparent';
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Ranking</h1>
                        <p className="text-slate-400">Sprawdź swoją pozycję</p>
                    </div>
                </div>

                {/* User's rank card */}
                {userRank && (
                    <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-6 h-6 text-amber-400" />
                            <div>
                                <p className="text-sm text-slate-400">Twoja pozycja</p>
                                <p className="text-2xl font-bold text-amber-400">#{userRank}</p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Global / Friends Toggle */}
                <div className="bg-slate-800/50 p-1 rounded-xl flex self-start">
                    <button
                        onClick={() => setTab('global')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'global'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        Globalny
                    </button>
                    <button
                        onClick={() => setTab('friends')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'friends'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Znajomi
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 sm:ml-auto">
                    {/* Time Range Toggle */}
                    <div className="bg-slate-800/50 p-1 rounded-xl flex">
                        <button
                            onClick={() => {
                                setSortBy('weekly_xp');
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${sortBy === 'weekly_xp'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Ten tydzień
                        </button>
                        <button
                            onClick={() => {
                                if (sortBy === 'weekly_xp') setSortBy('xp');
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${sortBy !== 'weekly_xp'
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Cały czas
                        </button>
                    </div>

                    {/* Metric Select (only visible if All Time) */}
                    {sortBy !== 'weekly_xp' && (
                        <div className="flex bg-slate-800/50 p-1 rounded-xl">
                            {(['xp', 'level', 'streak'] as LeaderboardType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSortBy(type)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${sortBy === type
                                        ? 'bg-slate-700 text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {type === 'xp' && <Star className="w-3 h-3 inline mr-1" />}
                                    {type === 'level' && <ChevronUp className="w-3 h-3 inline mr-1" />}
                                    {type === 'streak' && <Flame className="w-3 h-3 inline mr-1" />}
                                    {type === 'xp' ? 'XP' : type === 'level' ? 'Lvl' : 'Streak'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
            ) : currentLeaderboard.length === 0 ? (
                <Card className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">
                        {tab === 'friends'
                            ? 'Dodaj znajomych, aby zobaczyć ranking'
                            : 'Brak danych w rankingu'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {currentLeaderboard.map((entry, index) => {
                        const isCurrentUser = entry.userId === userData?.id;
                        const rank = entry.rank || index + 1;

                        return (
                            <motion.div
                                key={entry.userId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                            >
                                <Card className={`p-4 border ${getRankBg(rank, isCurrentUser)}`}>
                                    <div className="flex items-center gap-4">
                                        {/* Rank */}
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                            {getRankIcon(rank)}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                            {entry.photoURL ? (
                                                <img
                                                    src={entry.photoURL}
                                                    alt={entry.displayName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                entry.displayName?.charAt(0).toUpperCase() || 'U'
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-semibold truncate ${isCurrentUser ? 'text-blue-400' : ''}`}>
                                                {entry.displayName}
                                                {isCurrentUser && ' (Ty)'}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-amber-400" />
                                                    Lvl {entry.level}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Flame className="w-3 h-3 text-orange-400" />
                                                    {entry.streak} dni
                                                </span>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-amber-400">
                                                {sortBy === 'xp' && entry.xp.toLocaleString()}
                                                {sortBy === 'weekly_xp' && (entry.weeklyXP || 0).toLocaleString()}
                                                {sortBy === 'level' && entry.level}
                                                {sortBy === 'streak' && entry.streak}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {sortBy === 'xp' && 'Całkowite XP'}
                                                {sortBy === 'weekly_xp' && 'XP w tym tyg.'}
                                                {sortBy === 'level' && 'poziom'}
                                                {sortBy === 'streak' && 'dni'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
