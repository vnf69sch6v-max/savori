'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Sparkles, Lock, Check, Coins, Crown } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KITCHEN_ITEMS, getRarityColor, getRarityLabel, getCategoryLabel, getCategoryEmoji, calculateKitchenValue } from '@/lib/game-data';
import { KitchenItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VirtualKitchen() {
    const { userData } = useAuth();
    const { t } = useLanguage();
    const { isFree, openUpgrade } = useSubscription();
    const userPoints = userData?.gamification?.points || 0;
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [purchasing, setPurchasing] = useState<string | null>(null);

    // Fetch owned items
    useEffect(() => {
        if (!userData?.id) return;

        const fetchData = async () => {
            try {
                const kitchenRef = doc(db, 'users', userData.id, 'kitchen', 'items');
                const kitchenSnap = await getDoc(kitchenRef);

                if (kitchenSnap.exists()) {
                    setOwnedItems(kitchenSnap.data().ownedItems || []);
                }
            } catch (error) {
                console.error('Error fetching kitchen data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userData?.id]);

    // Purchase item
    const purchaseItem = async (item: KitchenItem) => {
        if (!userData?.id) return;
        if (userPoints < item.price) {
            toast.error('Za mało punktów!');
            return;
        }
        if (ownedItems.includes(item.id)) {
            toast.error('Już masz ten przedmiot!');
            return;
        }

        setPurchasing(item.id);

        try {
            // Deduct points
            const userRef = doc(db, 'users', userData.id);
            await updateDoc(userRef, {
                'gamification.points': increment(-item.price),
            });

            // Add item to kitchen
            const kitchenRef = doc(db, 'users', userData.id, 'kitchen', 'items');
            const kitchenSnap = await getDoc(kitchenRef);

            if (kitchenSnap.exists()) {
                await updateDoc(kitchenRef, {
                    ownedItems: arrayUnion(item.id),
                });
            } else {
                await setDoc(kitchenRef, {
                    ownedItems: [item.id],
                });
            }

            setOwnedItems(prev => [...prev, item.id]);

            toast.success(
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span>Kupiono {item.name}!</span>
                </div>
            );
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error('Błąd zakupu');
        } finally {
            setPurchasing(null);
        }
    };

    // Filter items
    const filteredItems = selectedCategory === 'all'
        ? KITCHEN_ITEMS
        : KITCHEN_ITEMS.filter(item => item.category === selectedCategory);

    // Sort by price
    const sortedItems = [...filteredItems].sort((a, b) => a.price - b.price);

    const categories = ['all', 'appliance', 'decoration', 'companion', 'food'];

    return (
        <div>
            {/* Header Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold">{t('shop.title')}</h2>
                    <p className="text-slate-400 text-sm">{t('shop.subtitle')}</p>
                </div>

                {/* Points Balance */}
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-xl border border-amber-500/30 w-fit">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-amber-400">{userPoints.toLocaleString()}</span>
                    <span className="text-amber-400/70">pkt</span>
                </div>
            </div>

            {/* Kitchen Value */}
            {ownedItems.length > 0 && (
                <Card className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className="text-slate-300 font-medium">Kolekcja</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold">{ownedItems.length} przedmiotów</span>
                            <span className="text-purple-400 font-medium hidden sm:inline">
                                wartość: {calculateKitchenValue(ownedItems).toLocaleString()} pkt
                            </span>
                        </div>
                    </div>
                    {/* Show owned items */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {ownedItems.map(id => {
                            const item = KITCHEN_ITEMS.find(i => i.id === id);
                            return item ? (
                                <div key={id} className="relative group cursor-help">
                                    <span className="text-2xl grayscale-0 transition-all hover:scale-110 block" title={item.name}>
                                        {item.emoji}
                                    </span>
                                </div>
                            ) : null;
                        })}
                    </div>
                </Card>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {cat === 'all' ? '🏠 Wszystko' : `${getCategoryEmoji(cat)} ${getCategoryLabel(cat)}`}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {sortedItems.map((item, i) => {
                    const owned = ownedItems.includes(item.id);
                    const canAfford = userPoints >= item.price;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card
                                className={`relative h-full overflow-hidden transition-all hover:scale-[1.02] ${owned
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : canAfford
                                        ? 'hover:border-slate-500 border-slate-700'
                                        : 'opacity-60 border-slate-800 grayscale-[0.5]'
                                    }`}
                            >
                                {/* Rarity Badge */}
                                <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getRarityColor(item.rarity)}`}>
                                    {getRarityLabel(item.rarity)}
                                </div>

                                {/* Owned Badge */}
                                {owned && (
                                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}

                                <CardContent className="pt-8 pb-4 px-4 flex flex-col items-center text-center h-full">
                                    {/* Emoji */}
                                    <div className="text-4xl md:text-5xl mb-3 drop-shadow-2xl filter">{item.emoji}</div>

                                    {/* Name & Description */}
                                    <h3 className="font-semibold text-sm md:text-base mb-1 text-slate-200">{item.name}</h3>
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2.5em]">{item.description}</p>

                                    {/* Effect if any */}
                                    {item.effect && (
                                        <div className="text-[10px] text-purple-400 mb-4 bg-purple-500/10 px-2 py-1 rounded-lg">
                                            ✨ {item.effect}
                                        </div>
                                    )}

                                    <div className="mt-auto w-full pt-3 border-t border-slate-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                                            <span className={`font-bold text-sm ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>{item.price}</span>
                                        </div>

                                        {owned ? (
                                            <span className="text-xs font-medium text-emerald-500">{t('shop.owned')}</span>
                                        ) : isFree ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="h-7 text-xs px-3 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                                onClick={() => openUpgrade('shop')}
                                            >
                                                <Crown className="w-3 h-3 mr-1" />
                                                Pro
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant={canAfford ? "primary" : "secondary"}
                                                className={`h-7 text-xs px-3 ${canAfford ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                                                disabled={!canAfford || purchasing === item.id}
                                                onClick={() => purchaseItem(item)}
                                            >
                                                {purchasing === item.id ? (
                                                    <span className="animate-spin">⏳</span>
                                                ) : !canAfford ? (
                                                    <Lock className="w-3 h-3" />
                                                ) : (
                                                    t('shop.buy')
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
