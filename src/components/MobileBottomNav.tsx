'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Camera,
    Target,
    Trophy,
    MoreHorizontal
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Główna' },
    { href: '/scan', icon: Camera, label: 'Skanuj' },
    { href: '/goals', icon: Target, label: 'Cele' },
    { href: '/achievements', icon: Trophy, label: 'Osiągnięcia' },
    { href: '/more', icon: MoreHorizontal, label: 'Więcej' },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    // Don't show on auth pages
    if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/') {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
            {/* Gradient blur background */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800" />

            {/* Safe area for iOS */}
            <div className="relative flex items-center justify-around px-2 py-2 pb-safe">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center py-3 px-4 min-w-[64px] min-h-[54px]"
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-500 rounded-full"
                                />
                            )}

                            {/* Icon */}
                            <motion.div
                                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                className={`relative ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
                            >
                                <item.icon className="w-6 h-6" />

                                {/* Scan button glow */}
                                {item.href === '/scan' && (
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md -z-10" />
                                )}
                            </motion.div>

                            {/* Label */}
                            <span className={`text-[10px] mt-1 ${isActive ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
