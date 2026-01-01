'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { fireConfetti } from '@/hooks/useConfetti';

function BillingSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (sessionId) {
            fireConfetti();
        }
    }, [sessionId]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400"
                >
                    <Check className="w-10 h-10" />
                </motion.div>

                <div>
                    <h1 className="text-2xl font-bold mb-2">Płatność zakończona sukcesem! 🎉</h1>
                    <p className="text-slate-400">
                        Twoje konto zostało ulepszone. Dziękujemy za zaufanie!
                    </p>
                </div>

                <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => router.push('/settings')}
                >
                    Wróć do ustawień
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Card>
        </div>
    );
}

export default function BillingSuccessPage() {
    return (
        <Suspense fallback={<div>Ładowanie...</div>}>
            <BillingSuccessContent />
        </Suspense>
    );
}
