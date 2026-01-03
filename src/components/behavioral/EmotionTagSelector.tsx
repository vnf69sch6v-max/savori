'use client';

/**
 * EmotionTagSelector
 * HALT-based emotion picker modal for tagging transactions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { EmotionTag } from '@/types';
import { EMOTIONS, EmotionMeta } from '@/lib/behavioral-categories';

interface EmotionTagSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (emotion: EmotionTag) => void;
    transactionDescription?: string;
}

export default function EmotionTagSelector({
    isOpen,
    onClose,
    onSelect,
    transactionDescription,
}: EmotionTagSelectorProps) {
    const emotionList = Object.values(EMOTIONS);

    const handleSelect = (emotion: EmotionTag) => {
        onSelect(emotion);
        onClose();
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

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8"
                    >
                        <div className="bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden max-w-md mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-800">
                                <div>
                                    <h3 className="font-semibold text-white text-lg">
                                        Jak się czułeś?
                                    </h3>
                                    {transactionDescription && (
                                        <p className="text-sm text-slate-400 mt-0.5 truncate max-w-[250px]">
                                            przy: {transactionDescription}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Emotion Grid */}
                            <div className="p-5 grid grid-cols-4 gap-3">
                                {emotionList.map((emotion) => (
                                    <EmotionButton
                                        key={emotion.id}
                                        emotion={emotion}
                                        onSelect={() => handleSelect(emotion.id)}
                                    />
                                ))}
                            </div>

                            {/* Skip Option */}
                            <div className="px-5 pb-5">
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Pomiń
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function EmotionButton({
    emotion,
    onSelect
}: {
    emotion: EmotionMeta;
    onSelect: () => void;
}) {
    return (
        <motion.button
            onClick={onSelect}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl 
                       bg-slate-800/50 border border-slate-700/30
                       hover:bg-${emotion.color}-500/20 hover:border-${emotion.color}-500/30
                       transition-colors`}
        >
            <span className="text-3xl">{emotion.emoji}</span>
            <span className="text-xs text-slate-400">{emotion.name}</span>
        </motion.button>
    );
}
