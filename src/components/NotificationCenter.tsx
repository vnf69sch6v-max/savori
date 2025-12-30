
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

export default function NotificationCenter() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (id: string, read: boolean, actionUrl?: string) => {
        if (!read) {
            await markAsRead(id);
        }
        if (actionUrl) {
            // Normalize URL to handle internal routing if needed, 
            // though simple window.location is fine for now if it's external or absolute
            window.location.href = actionUrl;
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
                <Bell className="w-5 h-5" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                            <h3 className="font-semibold text-white">Powiadomienia</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                                >
                                    <Check className="w-3 h-3" />
                                    Oznacz wszystkie
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">Brak nowych powiadomień</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`relative group p-4 hover:bg-slate-800/50 transition-colors cursor-pointer ${!notification.read ? 'bg-slate-800/30' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification.id, notification.read, notification.actionUrl)}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className="text-2xl pt-1">
                                                    {notification.emoji || '🔔'}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-sm font-medium mb-0.5 ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-[10px] text-slate-500 mt-2 block">
                                                        {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: pl }) : 'teraz'}
                                                    </span>
                                                </div>

                                                {/* Actions (visible on hover) */}
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg"
                                                            title="Oznacz jako przeczytane"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                                                        title="Usuń"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Unread indicator dot */}
                                            {!notification.read && (
                                                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full group-hover:hidden" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
