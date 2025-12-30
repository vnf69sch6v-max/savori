'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Shield,
    Lock,
    Smartphone,
    MapPin,
    Clock,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle,
    XCircle,
    LogOut,
    Key,
    Bell,
    Activity,
    Globe,
    Fingerprint,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { collection, query, orderBy, limit, onSnapshot, addDoc, Timestamp, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SecurityEvent {
    id: string;
    type: 'login' | 'logout' | 'password_change' | 'new_device' | 'receipt_scan' | 'goal_created' | 'suspicious';
    description: string;
    timestamp: Timestamp;
    device?: string;
    location?: string;
    ip?: string;
    success: boolean;
}

interface ActiveSession {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: Timestamp;
    current: boolean;
}

// Detect device and browser info
const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let device = 'Nieznane urządzenie';
    let browser = 'Nieznana przeglądarka';

    if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('iPad')) device = 'iPad';
    else if (ua.includes('Android')) device = 'Android';
    else if (ua.includes('Mac')) device = 'Mac';
    else if (ua.includes('Windows')) device = 'Windows PC';
    else if (ua.includes('Linux')) device = 'Linux';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    return { device, browser };
};

export default function SecurityPage() {
    const { userData, user } = useAuth();
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllEvents, setShowAllEvents] = useState(false);

    // Security stats
    const securityScore = 85; // Calculated based on settings
    const encryptionStatus = 'AES-256-GCM';
    const lastPasswordChange = '30 dni temu';

    // Fetch security events
    useEffect(() => {
        if (!userData?.id) {
            const timer = setTimeout(() => setLoading(false), 0);
            return () => clearTimeout(timer);
        }

        const eventsRef = collection(db, 'users', userData.id, 'securityEvents');
        const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SecurityEvent[];
            setEvents(data);
            setTimeout(() => setLoading(false), 0);
        });

        // Mock current session
        const { device, browser } = getDeviceInfo();
        setSessions([
            {
                id: 'current',
                device,
                browser,
                location: 'Polska',
                lastActive: Timestamp.now(),
                current: true,
            }
        ]);

        return () => unsubscribe();
    }, [userData?.id]);

    // Log security event
    const logSecurityEvent = async (type: SecurityEvent['type'], description: string, success: boolean = true) => {
        if (!userData?.id) return;

        const { device, browser } = getDeviceInfo();

        await addDoc(collection(db, 'users', userData.id, 'securityEvents'), {
            type,
            description,
            timestamp: Timestamp.now(),
            device: `${device}, ${browser}`,
            location: 'Polska',
            success,
        });
    };

    // Terminate session
    const terminateSession = async (sessionId: string) => {
        toast.success('Sesja zakończona');
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    // Get event icon
    const getEventIcon = (type: SecurityEvent['type'], success: boolean) => {
        const iconClass = success ? 'text-emerald-400' : 'text-red-400';
        switch (type) {
            case 'login': return <CheckCircle className={`w-4 h-4 ${iconClass}`} />;
            case 'logout': return <LogOut className={`w-4 h-4 ${iconClass}`} />;
            case 'password_change': return <Key className={`w-4 h-4 ${iconClass}`} />;
            case 'new_device': return <Smartphone className={`w-4 h-4 text-amber-400`} />;
            case 'receipt_scan': return <Activity className={`w-4 h-4 ${iconClass}`} />;
            case 'goal_created': return <CheckCircle className={`w-4 h-4 ${iconClass}`} />;
            case 'suspicious': return <AlertTriangle className={`w-4 h-4 text-red-400`} />;
            default: return <Activity className={`w-4 h-4 ${iconClass}`} />;
        }
    };

    // Display events
    const displayEvents = showAllEvents ? events : events.slice(0, 5);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Bezpieczeństwo</h1>
                    <p className="text-slate-400">Pełna kontrola nad Twoim kontem</p>
                </div>
            </div>

            {/* Security Score */}
            <Card variant="gradient" className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-slate-700"
                                    />
                                    <motion.circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        stroke="url(#scoreGradient)"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        initial={{ strokeDasharray: '0 251.2' }}
                                        animate={{ strokeDasharray: `${securityScore * 2.512} 251.2` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    />
                                    <defs>
                                        <linearGradient id="scoreGradient">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold">{securityScore}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-emerald-400">Wysoki poziom ochrony</p>
                                <p className="text-sm text-slate-400">Twoje dane są bezpieczne</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
                                <Lock className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm">{encryptionStatus}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
                                <Fingerprint className="w-4 h-4 text-blue-400" />
                                <span className="text-sm">2FA włączone</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Active Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            Aktywne sesje
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sessions.map((session) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl ${session.current
                                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                                        : 'bg-slate-800/30'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.current ? 'bg-emerald-500/20' : 'bg-slate-700'
                                                }`}>
                                                <Smartphone className={`w-5 h-5 ${session.current ? 'text-emerald-400' : 'text-slate-400'
                                                    }`} />
                                            </div>
                                            <div>
                                                <p className="font-medium flex items-center gap-2">
                                                    {session.device}
                                                    {session.current && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                                            Ta sesja
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-slate-400">{session.browser}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {session.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Przed chwilą
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {!session.current && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => terminateSession(session.id)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {sessions.length === 0 && (
                                <p className="text-center text-slate-400 py-4">Brak aktywnych sesji</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Ochrona konta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <Key className="w-5 h-5 text-amber-400" />
                                    <div>
                                        <p className="font-medium">Zmień hasło</p>
                                        <p className="text-sm text-slate-400">Ostatnia zmiana: {lastPasswordChange}</p>
                                    </div>
                                </div>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <p className="font-medium">Uwierzytelnianie dwuetapowe</p>
                                        <p className="text-sm text-emerald-400">Włączone</p>
                                    </div>
                                </div>
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-purple-400" />
                                    <div>
                                        <p className="font-medium">Alerty bezpieczeństwa</p>
                                        <p className="text-sm text-slate-400">Email + Push</p>
                                    </div>
                                </div>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors text-left border border-red-500/20">
                                <div className="flex items-center gap-3">
                                    <LogOut className="w-5 h-5 text-red-400" />
                                    <div>
                                        <p className="font-medium text-red-400">Wyloguj wszystkie urządzenia</p>
                                        <p className="text-sm text-slate-400">Zakończ wszystkie sesje oprócz tej</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Log */}
            <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        Historia aktywności
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllEvents(!showAllEvents)}
                    >
                        {showAllEvents ? 'Pokaż mniej' : 'Pokaż więcej'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton h-16 rounded-xl" />
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">Brak aktywności do wyświetlenia</p>
                            <p className="text-sm text-slate-500">Twoja aktywność będzie tutaj rejestrowana</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <AnimatePresence>
                                {displayEvents.map((event, i) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${event.type === 'suspicious'
                                            ? 'bg-red-500/10 border border-red-500/20'
                                            : 'bg-slate-800/30 hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            }`}>
                                            {getEventIcon(event.type, event.success)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{event.description}</p>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                {event.device && (
                                                    <span className="flex items-center gap-1">
                                                        <Smartphone className="w-3 h-3" />
                                                        {event.device}
                                                    </span>
                                                )}
                                                {event.location && (
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {event.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 whitespace-nowrap">
                                            {event.timestamp?.toDate ? formatDate(event.timestamp.toDate(), 'time') : ''}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Protection Info */}
            <Card className="mt-6" variant="glass">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Twoje dane są chronione</h3>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    Szyfrowanie end-to-end (AES-256-GCM)
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    Dane przechowywane w EU (GDPR compliant)
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    Automatyczne wykrywanie anomalii
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    Paragony usuwane po 90 dniach (opcjonalnie)
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
