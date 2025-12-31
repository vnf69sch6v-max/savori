'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    Phone,
    Video,
    Calendar,
    Clock,
    User,
    Send,
    X,
    CheckCircle2,
    Sparkles,
    Star
} from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import toast from 'react-hot-toast';

interface Advisor {
    id: string;
    name: string;
    title: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    specialties: string[];
    available: boolean;
    nextAvailable?: Date;
}

interface HumanTouchProps {
    isOpen: boolean;
    onClose: () => void;
}

const ADVISORS: Advisor[] = [
    {
        id: '1',
        name: 'Anna Kowalska',
        title: 'Doradca Finansowy',
        avatar: '👩‍💼',
        rating: 4.9,
        reviewCount: 127,
        specialties: ['Budżetowanie', 'Oszczędzanie', 'Kredyty'],
        available: true,
    },
    {
        id: '2',
        name: 'Piotr Nowak',
        title: 'Ekspert ds. Inwestycji',
        avatar: '👨‍💼',
        rating: 4.8,
        reviewCount: 89,
        specialties: ['Inwestycje', 'Planowanie emerytalne'],
        available: false,
        nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h from now
    },
    {
        id: '3',
        name: 'Marta Wiśniewska',
        title: 'Specjalista ds. Długów',
        avatar: '👩‍🏫',
        rating: 5.0,
        reviewCount: 64,
        specialties: ['Restrukturyzacja długów', 'Negocjacje z bankami'],
        available: true,
    },
];

type ViewMode = 'advisors' | 'chat' | 'callback';

export default function HumanTouch({ isOpen, onClose }: HumanTouchProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('advisors');
    const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
    const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; time: Date }>>([]);
    const [inputMessage, setInputMessage] = useState('');

    // Callback form
    const [callbackForm, setCallbackForm] = useState({
        name: '',
        phone: '',
        preferredTime: '',
        topic: '',
    });

    const handleStartChat = (advisor: Advisor) => {
        setSelectedAdvisor(advisor);
        setMessages([
            {
                text: `Cześć! Jestem ${advisor.name}. W czym mogę Ci dzisiaj pomóc?`,
                isUser: false,
                time: new Date(),
            },
        ]);
        setViewMode('chat');
    };

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return;

        setMessages(prev => [...prev, {
            text: inputMessage,
            isUser: true,
            time: new Date(),
        }]);

        setInputMessage('');

        // Simulate advisor response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: 'Dziękuję za wiadomość! Analizuję Twoje pytanie i zaraz odpowiem...',
                isUser: false,
                time: new Date(),
            }]);
        }, 1500);
    };

    const handleRequestCallback = () => {
        if (!callbackForm.name || !callbackForm.phone) {
            toast.error('Wypełnij wymagane pola');
            return;
        }

        toast.success('Zamówiono rozmowę! Doradca zadzwoni wkrótce.');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end md:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full md:max-w-lg md:max-h-[80vh] bg-slate-900 border border-slate-700 md:rounded-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold">Human Touch</h2>
                                <p className="text-xs text-slate-400">
                                    {viewMode === 'chat' && selectedAdvisor
                                        ? `Rozmowa z ${selectedAdvisor.name}`
                                        : 'Porozmawiaj z doradcą'
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Advisors List */}
                    {viewMode === 'advisors' && (
                        <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
                            <div className="flex gap-2 mb-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setViewMode('callback')}
                                    className="flex-1"
                                >
                                    <Phone className="w-4 h-4 mr-1" />
                                    Zamów rozmowę
                                </Button>
                            </div>

                            <h3 className="text-sm font-medium text-slate-400">Dostępni doradcy</h3>

                            {ADVISORS.map((advisor) => (
                                <motion.div
                                    key={advisor.id}
                                    whileHover={{ scale: 1.01 }}
                                    className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-4xl">{advisor.avatar}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{advisor.name}</h4>
                                                {advisor.available && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400">{advisor.title}</p>

                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-0.5 text-amber-400">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span className="text-xs">{advisor.rating}</span>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    ({advisor.reviewCount} opinii)
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {advisor.specialties.map((s) => (
                                                    <span
                                                        key={s}
                                                        className="px-2 py-0.5 text-[10px] bg-slate-700/50 rounded-full"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                                        {advisor.available ? (
                                            <Button
                                                size="sm"
                                                className="w-full"
                                                onClick={() => handleStartChat(advisor)}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1" />
                                                Rozpocznij czat
                                            </Button>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-xs text-slate-500 mb-2">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    Dostępny od {advisor.nextAvailable?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <Button size="sm" variant="outline" className="w-full">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    Umów spotkanie
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Chat View */}
                    {viewMode === 'chat' && selectedAdvisor && (
                        <div className="flex flex-col h-[60vh]">
                            <div className="flex-1 p-4 overflow-auto space-y-3">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.isUser
                                                ? 'bg-purple-500 text-white rounded-br-sm'
                                                : 'bg-slate-800 rounded-bl-sm'
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className={`text-[10px] mt-1 ${msg.isUser ? 'text-purple-200' : 'text-slate-500'}`}>
                                                {msg.time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-700">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Napisz wiadomość..."
                                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <Button onClick={handleSendMessage}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                                <button
                                    onClick={() => setViewMode('advisors')}
                                    className="w-full mt-2 text-xs text-slate-500 hover:text-slate-400"
                                >
                                    ← Wróć do listy doradców
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Callback Form */}
                    {viewMode === 'callback' && (
                        <div className="p-4 space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Phone className="w-5 h-5 text-purple-400" />
                                Zamów rozmowę z doradcą
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Imię i nazwisko *</label>
                                    <input
                                        type="text"
                                        value={callbackForm.name}
                                        onChange={(e) => setCallbackForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Numer telefonu *</label>
                                    <input
                                        type="tel"
                                        value={callbackForm.phone}
                                        onChange={(e) => setCallbackForm(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="+48 XXX XXX XXX"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Preferowana godzina</label>
                                    <select
                                        value={callbackForm.preferredTime}
                                        onChange={(e) => setCallbackForm(p => ({ ...p, preferredTime: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    >
                                        <option value="">Dowolna</option>
                                        <option value="morning">Rano (9:00-12:00)</option>
                                        <option value="afternoon">Po południu (12:00-17:00)</option>
                                        <option value="evening">Wieczorem (17:00-20:00)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Temat rozmowy</label>
                                    <textarea
                                        value={callbackForm.topic}
                                        onChange={(e) => setCallbackForm(p => ({ ...p, topic: e.target.value }))}
                                        placeholder="O czym chciałbyś porozmawiać?"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" onClick={() => setViewMode('advisors')} className="flex-1">
                                    Anuluj
                                </Button>
                                <Button onClick={handleRequestCallback} className="flex-1">
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Zamów rozmowę
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
