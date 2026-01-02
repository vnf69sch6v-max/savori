'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Share2, Sparkles } from 'lucide-react';
import { MoneyWrapped, WrappedSlide } from '@/lib/engagement/wrapped';

interface MoneyWrappedModalProps {
    wrapped: MoneyWrapped;
    isOpen: boolean;
    onClose: () => void;
}

// Slide component with animations
function Slide({ slide, isActive }: { slide: WrappedSlide; isActive: boolean }) {
    return (
        <AnimatePresence mode="wait">
            {isActive && (
                <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br ${slide.color}`}
                >
                    {/* Icon */}
                    {slide.icon && (
                        <motion.span
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="text-6xl mb-6"
                        >
                            {slide.icon}
                        </motion.span>
                    )}

                    {/* Title */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-lg font-medium text-center mb-2"
                    >
                        {slide.title}
                    </motion.p>

                    {/* Main value */}
                    {slide.value && (
                        <motion.h2
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            className={`text-5xl md:text-6xl font-bold text-white text-center mb-3 ${slide.highlight ? 'animate-pulse' : ''}`}
                        >
                            {slide.value}
                        </motion.h2>
                    )}

                    {/* Subtitle */}
                    {slide.subtitle && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-white/90 text-center mb-4"
                        >
                            {slide.subtitle}
                        </motion.p>
                    )}

                    {/* Description */}
                    {slide.description && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-white/60 text-center max-w-xs"
                        >
                            {slide.description}
                        </motion.p>
                    )}

                    {/* Decorative elements */}
                    <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Progress bar component
function ProgressBar({
    totalSlides,
    currentIndex,
    isPaused
}: {
    totalSlides: number;
    currentIndex: number;
    isPaused: boolean;
}) {
    return (
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
            {Array.from({ length: totalSlides }).map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: i < currentIndex ? '100%' : '0%' }}
                        animate={{
                            width: i < currentIndex ? '100%' : i === currentIndex ? '100%' : '0%'
                        }}
                        transition={{
                            duration: i === currentIndex ? 5 : 0,
                            ease: 'linear',
                        }}
                        style={{
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    />
                </div>
            ))}
        </div>
    );
}

export default function MoneyWrappedModal({ wrapped, isOpen, onClose }: MoneyWrappedModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const slides = wrapped.slides;
    const totalSlides = slides.length;

    // Auto-advance slides
    useEffect(() => {
        if (!isOpen || isPaused) return;

        const timer = setInterval(() => {
            setCurrentIndex(prev => {
                if (prev >= totalSlides - 1) {
                    return prev; // Stay on last slide
                }
                return prev + 1;
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [isOpen, isPaused, totalSlides]);

    // Note: Parent should reset state when closing or use key prop to reset

    // Navigation
    const goNext = useCallback(() => {
        if (currentIndex < totalSlides - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    }, [currentIndex, totalSlides, onClose]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight' || e.key === ' ') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, goNext, goPrev, onClose]);

    // Share functionality (placeholder)
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Mój ${wrapped.periodLabel}`,
                    text: `${wrapped.periodLabel}: Wydałem ${wrapped.summary.heroStat}. Top kategoria: ${wrapped.summary.topCategory}. #Savori`,
                });
            } catch {
                console.log('Share cancelled');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={(e) => {
                // Click left = prev, right = next
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width / 3) {
                    goPrev();
                } else if (x > rect.width * 2 / 3) {
                    goNext();
                }
            }}
        >
            {/* Main container - phone-like aspect ratio */}
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="relative w-full max-w-md h-[85vh] max-h-[700px] rounded-3xl overflow-hidden shadow-2xl"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress bar */}
                <ProgressBar
                    totalSlides={totalSlides}
                    currentIndex={currentIndex}
                    isPaused={isPaused}
                />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Slides */}
                {slides.map((slide, index) => (
                    <Slide key={slide.id} slide={slide} isActive={index === currentIndex} />
                ))}

                {/* Bottom section */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/40 to-transparent">
                    {/* Period label */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-white/60" />
                            <span className="text-white/60 text-sm">{wrapped.periodLabel}</span>
                        </div>
                        <span className="text-white/40 text-xs">{wrapped.dateRange}</span>
                    </div>

                    {/* Navigation and share */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={goPrev}
                                disabled={currentIndex === 0}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={goNext}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Share button - only on last slide */}
                        {currentIndex === totalSlides - 1 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleShare}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                Udostępnij
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Slide counter */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/40 text-sm">
                    {currentIndex + 1} / {totalSlides}
                </div>
            </motion.div>
        </motion.div>
    );
}
