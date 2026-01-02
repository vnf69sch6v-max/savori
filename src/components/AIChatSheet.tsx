'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X, Sparkles, Send, Mic, ArrowUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const QUICK_SUGGESTIONS = [
    'Na co mnie stać?',
    'Ile wydałem dziś?',
    'Porównaj z zeszłym miesiącem',
    'Gdzie oszczędzić?',
];

const INITIAL_MESSAGE: Message = {
    id: 'welcome',
    role: 'assistant',
    content: 'Cześć! 👋 Jestem Twoim asystentem finansowym. Zapytaj mnie o cokolwiek związanego z Twoimi finansami.',
    timestamp: new Date(),
};

interface AIChatSheetProps {
    isOpen: boolean;
    onClose: () => void;
    context?: {
        expenses: any[];
        budget: any;
        userName: string;
    };
}

export default function AIChatSheet({ isOpen, onClose, context }: AIChatSheetProps) {
    const { t, language } = useLanguage();

    // Dynamic suggestions based on language
    const QUICK_SUGGESTIONS = [
        t('aiChat.suggestions.afford'),
        t('aiChat.suggestions.todaySpent'),
        t('aiChat.suggestions.compare'),
        t('aiChat.suggestions.whereSave'),
    ];

    const INITIAL_MESSAGE: Message = {
        id: 'welcome',
        role: 'assistant',
        content: t('aiChat.welcome'),
        timestamp: new Date(),
    };

    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragControls = useDragControls();

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async (text?: string) => {
        const messageText = text || inputValue.trim();
        if (!messageText || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: messageText,
                    context: context || {} // Send real context
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            const aiMessage: Message = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.answer || t('aiChat.noResponse'),
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: t('aiChat.error'),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragControls={dragControls}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col"
                        style={{ touchAction: 'none' }}
                    >
                        {/* Drag Handle */}
                        <div
                            className="flex justify-center py-3"
                            onPointerDown={(e) => dragControls.start(e)}
                        >
                            <div className="w-10 h-1 bg-slate-600 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                </div>
                                <span className="font-semibold text-white">{t('aiChat.title')}</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Quick Suggestions */}
                        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
                            {QUICK_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleSend(suggestion)}
                                    className="shrink-0 px-3 py-1.5 rounded-full text-sm bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-[200px]">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2 shrink-0">
                                            <Sparkles className="w-4 h-4 text-purple-400" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${message.role === 'user'
                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                                            : 'bg-slate-800/80 text-slate-200'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed">{message.content}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-800 pb-safe">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={t('aiChat.placeholder')}
                                    className="flex-1 h-12 px-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowUp className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
