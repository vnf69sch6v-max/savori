'use client';

import { useCallback } from 'react';

export function useHaptic() {
    const vibrate = useCallback((pattern: number | number[]) => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    }, []);

    const trigger = useCallback((type: 'soft' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
        switch (type) {
            case 'soft':
                vibrate(10);
                break;
            case 'medium':
                vibrate(40);
                break;
            case 'heavy':
                vibrate(70);
                break;
            case 'success':
                vibrate([50, 50, 50]);
                break;
            case 'error':
                vibrate([100, 50, 100, 50, 100]);
                break;
            case 'warning':
                vibrate([30, 50, 100]);
                break;
        }
    }, [vibrate]);

    return { trigger };
}
