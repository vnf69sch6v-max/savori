'use client';

/**
 * PageTransition
 * iOS-style smooth page transition wrapper
 */

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

const pageVariants = {
    initial: {
        opacity: 0,
        x: 20,
        scale: 0.98,
    },
    in: {
        opacity: 1,
        x: 0,
        scale: 1,
    },
    out: {
        opacity: 0,
        x: -20,
        scale: 0.98,
    },
};

const pageTransition = {
    type: 'spring' as const,
    damping: 30,
    stiffness: 300,
    mass: 0.8,
};

export default function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

// iOS-style slide from right (for drill-down navigation)
export const slideFromRight = {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-30%', opacity: 0.5 },
    transition: { type: 'spring', damping: 25, stiffness: 300 },
};

// iOS-style slide from bottom (for modals/sheets)
export const slideFromBottom = {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { type: 'spring', damping: 30, stiffness: 300 },
};

// Fade transition (for tab switches)
export const fadeTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
};
