'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Percent, ArrowRight, ExternalLink, Target } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { SNBLProduct, SNBLGoal } from '@/types';
import { toast } from 'react-hot-toast';
import { snblService } from '@/lib/snbl-service';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

const MOCK_SNBL_PRODUCTS: SNBLProduct[] = [
    {
        id: 'iphone_15_pro',
        name: 'iPhone 15 Pro Titanium',
        price: 599900,
        merchantId: 'media_expert',
        merchantName: 'Media Expert',
        category: 'electronics',
        imageUrl: 'https://images.unsplash.com/photo-1696446702183-cbd933e3871b?auto=format&fit=crop&q=80&w=600',
        boosts: [{ typeLabel: 'Cashback', value: 5 }],
        affiliateUrl: 'https://mediaexpert.pl'
    },
    {
        id: 'ps5_slim',
        name: 'PlayStation 5 Slim',
        price: 269900,
        merchantId: 'morele',
        merchantName: 'Morele.net',
        category: 'electronics',
        imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=600',
        boosts: [{ typeLabel: 'Gra gratis', value: 0 }, { typeLabel: 'Cashback', value: 2 }],
    },
    {
        id: 'macbook_air_m2',
        name: 'MacBook Air M2',
        price: 549900,
        merchantId: 'cortland',
        merchantName: 'Cortland',
        category: 'computers',
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=600',
        boosts: [{ typeLabel: 'Zniżka Edu', value: 6 }]
    },
    {
        id: 'lego_rivendell',
        name: 'LEGO Władca Pierścieni: Rivendell',
        price: 239900,
        merchantId: 'lego_store',
        merchantName: 'LEGO Store',
        category: 'toys',
        imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&q=80&w=600',
        boosts: [{ typeLabel: 'VIP Points x2', value: 0 }]
    }
];

export default function SNBLMarketplace() {
    const { userData } = useAuth();
    const [savingFor, setSavingFor] = useState<string | null>(null);
    const [activeGoals, setActiveGoals] = useState<SNBLGoal[]>([]);

    useEffect(() => {
        if (!userData?.id) return;

        const q = query(
            collection(db, 'users', userData.id, 'snbl_goals'),
            where('status', '==', 'saving')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const goals = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SNBLGoal[];
            setActiveGoals(goals);
        });

        return () => unsubscribe();
    }, [userData?.id]);

    const handleStartSaving = async (product: SNBLProduct) => {
        if (!userData?.id) return;
        setSavingFor(product.id);

        try {
            await snblService.createGoal(userData.id, product);
            toast.success(
                <div className="flex flex-col">
                    <span className="font-bold">Cel utworzony!</span>
                    <span className="text-sm">Rozpoczynasz oszczędzanie na {product.name}</span>
                </div>
            );
        } catch (error) {
            console.error('Error:', error);
            toast.error('Nie udało się utworzyć celu');
        } finally {
            setSavingFor(null);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🛍️</span>
                    Save Now Buy Later
                </h2>
                <p className="text-slate-400 text-sm">
                    Wybierz cel i zyskaj bonusy od partnerów. Oszczędzaj mądrze, kupuj taniej.
                </p>
            </div>

            {/* Active Goals */}
            {activeGoals.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Twoje aktywne cele</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {activeGoals.map(goal => (
                            <Card key={goal.id} className="p-4 border-indigo-500/30 bg-indigo-500/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                                        {goal.productImageUrl ? (
                                            <img src={goal.productImageUrl} alt={goal.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">🎯</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold truncate">{goal.productName}</h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span>{(goal.currentAmount / 100).toFixed(0)} zł</span>
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                                                />
                                            </div>
                                            <span>{(goal.targetAmount / 100).toFixed(0)} zł</span>
                                        </div>
                                    </div>
                                    <Link href={`/goals`}>
                                        <Button size="sm" variant="ghost" className="shrink-0 h-8 w-8 p-0">
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_SNBL_PRODUCTS.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="overflow-hidden hover:border-indigo-500/50 transition-all group h-full flex flex-col">
                            <div className="relative aspect-video bg-slate-800">
                                {/* Image Placeholder (using gradient if image fails load in real app, but here we have unsplash) */}
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3" />
                                    {product.merchantName}
                                </div>

                                {/* Boost Badge */}
                                <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
                                    {product.boosts.map((boost, idx) => (
                                        <div key={idx} className="bg-indigo-500/90 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg backdrop-blur-sm flex items-center gap-1">
                                            <Percent className="w-3 h-3" />
                                            {boost.typeLabel} {boost.value > 0 ? `${boost.value}%` : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <CardContent className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg mb-1 leading-tight">{product.name}</h3>
                                <p className="text-slate-400 text-xs mb-4 uppercase tracking-wider">{product.category}</p>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-800">
                                    <div>
                                        <p className="text-xs text-slate-500">Cena teraz</p>
                                        <p className="font-bold text-lg">{(product.price / 100).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</p>
                                    </div>
                                    <Button
                                        onClick={() => handleStartSaving(product)}
                                        disabled={savingFor === product.id}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {savingFor === product.id ? (
                                            <span className="animate-spin mr-2">⏳</span>
                                        ) : (
                                            <ArrowRight className="w-4 h-4 mr-2" />
                                        )}
                                        {savingFor === product.id ? 'Tworzenie...' : 'Oszczędzaj'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                <p className="text-slate-400 text-sm mb-2">Szukasz czegoś innego?</p>
                <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Wklej link do produktu
                </Button>
            </div>
        </div>
    );
}
