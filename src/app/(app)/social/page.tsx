'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    UserPlus,
    Mail,
    Check,
    X,
    Trash2,
    Loader2,
    Trophy,
    Flame,
    Star,
    Search,
    Send,
    Share2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { friendsService, Friend, FriendRequest } from '@/lib/social/friends-service';
import { leaderboardService, LeaderboardEntry } from '@/lib/social/leaderboard-service';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function SocialPage() {
    const { userData } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [tab, setTab] = useState<'friends' | 'requests'>('friends');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    // Fetch initial data
    useEffect(() => {
        if (!userData?.id) {
            const timer = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timer);
        }

        const unsubFriends = friendsService.subscribeFriends(userData.id, setFriends);
        const unsubRequests = friendsService.subscribePendingRequests(userData.id, setPendingRequests);

        // Fetch friends leaderboard
        leaderboardService.getFriendsLeaderboard(userData.id).then(setLeaderboard);

        setTimeout(() => setLoading(false), 0);

        return () => {
            unsubFriends();
            unsubRequests();
        };
    }, [userData?.id]);

    // Send friend request
    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData?.id || !email.trim()) return;

        setSending(true);
        const result = await friendsService.sendFriendRequest(
            userData.id,
            userData.displayName || 'Użytkownik',
            email.trim()
        );

        if (result.success) {
            toast.success('Zaproszenie wysłane! 📨');
            setEmail('');
        } else {
            toast.error(result.error || 'Błąd wysyłania');
        }
        setSending(false);
    };

    // Accept request
    const handleAccept = async (requestId: string) => {
        if (!userData?.id) return;
        const success = await friendsService.acceptFriendRequest(requestId, userData.id);
        if (success) {
            toast.success('Przyjęto zaproszenie! 🎉');
            // Refresh leaderboard
            leaderboardService.getFriendsLeaderboard(userData.id).then(setLeaderboard);
        }
    };

    // Reject request
    const handleReject = async (requestId: string) => {
        if (!userData?.id) return;
        await friendsService.rejectFriendRequest(requestId, userData.id);
        toast.success('Odrzucono zaproszenie');
    };

    // Unfriend
    const handleUnfriend = async (friendId: string) => {
        if (!userData?.id) return;
        if (!confirm('Czy na pewno chcesz usunąć tę osobę ze znajomych?')) return;

        const success = await friendsService.unfriend(userData.id, friendId);
        if (success) {
            toast.success('Usunięto ze znajomych');
            leaderboardService.getFriendsLeaderboard(userData.id).then(setLeaderboard);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Social</h1>
                        <p className="text-slate-400">Znajomi i rywalizacja</p>
                    </div>
                </div>

                <Link href="/leaderboard">
                    <Button variant="outline" className="gap-2">
                        <Trophy className="w-4 h-4" />
                        Zobacz ranking
                    </Button>
                </Link>
            </div>

            {/* Add Friend & Invite Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Add Friend Form */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-400" />
                            Dodaj znajomego
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendRequest} className="flex flex-col gap-3">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Wpisz email..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                            <Button type="submit" disabled={sending || !email.trim()} className="w-full">
                                {sending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Wyślij zaproszenie
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Invite System */}
                <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Star className="w-5 h-5 text-indigo-400" />
                            Zaproś znajomych
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-400 mb-4">
                            Zaproś znajomych do Savori i rywalizujcie o lepsze wyniki finansowe!
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 truncate">
                                {userData?.id || '...'}
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const text = `Dołącz do mnie w Savori! Mój kod: ${userData?.id}`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Savori - Dołącz do mnie!',
                                            text: text,
                                            url: window.location.origin
                                        }).catch(console.error);
                                    } else {
                                        navigator.clipboard.writeText(text);
                                        toast.success('Skopiowano kod do schowka!');
                                    }
                                }}
                            >
                                <span className="hidden sm:inline">Udostępnij</span>
                                <Share2 className="w-4 h-4 sm:hidden" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setTab('friends')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'friends'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <Users className="w-4 h-4 inline mr-2" />
                    Znajomi ({friends.length})
                </button>
                <button
                    onClick={() => setTab('requests')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'requests'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Zaproszenia
                    {pendingRequests.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 rounded-full text-xs">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {tab === 'friends' ? (
                        <motion.div
                            key="friends"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {friends.length === 0 ? (
                                <Card className="p-8 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                    <p className="text-slate-400 mb-2">Nie masz jeszcze znajomych</p>
                                    <p className="text-sm text-slate-500">
                                        Wyślij zaproszenie używając formularza powyżej
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {friends.map((friend, index) => (
                                        <motion.div
                                            key={friend.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="p-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                                        {friend.photoURL ? (
                                                            <img
                                                                src={friend.photoURL}
                                                                alt={friend.displayName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            friend.displayName?.charAt(0).toUpperCase() || 'U'
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{friend.displayName}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-amber-400" />
                                                                Lvl {friend.level || 1}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Flame className="w-3 h-3 text-orange-400" />
                                                                {friend.streak || 0} dni
                                                            </span>
                                                            <span>{friend.xp || 0} XP</span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <button
                                                        onClick={() => handleUnfriend(friend.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Usuń ze znajomych"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {pendingRequests.length === 0 ? (
                                <Card className="p-8 text-center">
                                    <Mail className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                                    <p className="text-slate-400">Brak oczekujących zaproszeń</p>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRequests.map((request, index) => (
                                        <motion.div
                                            key={request.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="p-4 border-blue-500/30 bg-blue-500/5">
                                                <div className="flex items-center gap-4">
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                                                        {request.fromUserPhoto ? (
                                                            <img
                                                                src={request.fromUserPhoto}
                                                                alt={request.fromUserName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            request.fromUserName?.charAt(0).toUpperCase() || 'U'
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold">{request.fromUserName}</h3>
                                                        <p className="text-sm text-slate-400">
                                                            Chce zostać Twoim znajomym
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAccept(request.id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Akceptuj
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(request.id)}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Mini Leaderboard */}
            {friends.length > 0 && leaderboard.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        Ranking znajomych
                    </h2>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="space-y-2">
                                {leaderboard.slice(0, 5).map((entry, index) => (
                                    <div
                                        key={entry.userId}
                                        className={`flex items-center gap-3 p-2 rounded-lg ${entry.userId === userData?.id ? 'bg-blue-500/10 border border-blue-500/30' : ''
                                            }`}
                                    >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500 text-white' :
                                            index === 1 ? 'bg-slate-400 text-white' :
                                                index === 2 ? 'bg-amber-700 text-white' :
                                                    'bg-slate-700 text-slate-300'
                                            }`}>
                                            {index + 1}
                                        </span>
                                        <span className="flex-1 font-medium truncate">
                                            {entry.displayName}
                                            {entry.userId === userData?.id && ' (Ty)'}
                                        </span>
                                        <span className="text-amber-400 font-bold">{entry.xp} XP</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
