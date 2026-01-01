'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }

        // Check if dismissed previously in session
        if (sessionStorage.getItem('pwa_prompt_dismissed')) {
            return;
        }

        // Android / Desktop Chrome
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowAndroidPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS Detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
            setShowIOSPrompt(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowAndroidPrompt(false);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        setShowAndroidPrompt(false);
        setShowIOSPrompt(false);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (isDismissed || (!showAndroidPrompt && !showIOSPrompt)) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:hidden"
            >
                <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-5 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Zainstaluj aplikację</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Zyskaj pełny ekran, szybsze działanie i powiadomienia.
                            </p>
                        </div>
                    </div>

                    {showAndroidPrompt && (
                        <Button
                            onClick={handleInstallClick}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium h-12 rounded-xl shadow-lg shadow-emerald-500/20"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Zainstaluj
                        </Button>
                    )}

                    {showIOSPrompt && (
                        <div className="bg-slate-800/50 rounded-xl p-3 text-sm text-slate-300 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-2">
                                1. Kliknij przycisk <Share className="w-4 h-4 text-blue-400" /> Udostępnij
                            </div>
                            <div className="flex items-center gap-2">
                                2. Wybierz <PlusSquare className="w-4 h-4 text-slate-200" /> Do ekranu początkowego
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
