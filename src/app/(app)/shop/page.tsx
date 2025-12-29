'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    ShoppingBag,
    Sparkles,
    Lock,
    Check,
    Filter,
    Coins
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import {
    KITCHEN_ITEMS,
    KitchenItem,
    getRarityColor,
    getRarityLabel,
    getCategoryLabel,
    getCategoryEmoji,
    calculateKitchenValue
} from '@/lib/kitchen';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ShopPage() {
    const { userData } = useAuth();
    const userPoints = userData?.gamification?.points || 0;
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [purchasing, setPurchasing] = useState<string | null>(null);

    // Fetch user data
    useEffect(() => {
        if (!userData?.id) return;

        const fetchData = async () => {
            try {
                // Points are now available in userData directly
                // No need to fetch separate gamification doc

                // Get kitchen data
                const kitchenRef = doc(db, 'users', userData.id, 'kitchen', 'items');
                const kitchenSnap = await getDoc(kitchenRef);

                if (kitchenSnap.exists()) {
                    setOwnedItems(kitchenSnap.data().ownedItems || []);
                }
            } catch (error) {
                console.error('Error fetching shop data:', error);
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

            // Update local state is handled by real-time listener in AuthContext
            // setUserPoints(prev => prev - item.price);
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
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Sklep</h1>
                        <p className="text-slate-400">Wirtualna Kuchnia</p>
                    </div>
                </div>

                {/* Points Balance */}
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-amber-400">{userPoints.toLocaleString()}</span>
                    <span className="text-amber-400/70">punktów</span>
                </div>
            </div>

            {/* Kitchen Value */}
            {ownedItems.length > 0 && (
                <Card className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <span className="text-slate-300">Twoja kuchnia</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-bold">{ownedItems.length} przedmiotów</span>
                            <span className="text-purple-400 font-medium">
                                wartość: {calculateKitchenValue(ownedItems).toLocaleString()} pkt
                            </span>
                        </div>
                    </div>
                    {/* Show owned items */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {ownedItems.map(id => {
                            const item = KITCHEN_ITEMS.find(i => i.id === id);
                            return item ? (
                                <span key={id} className="text-2xl" title={item.name}>
                                    {item.emoji}
                                </span>
                            ) : null;
                        })}
                    </div>
                </Card>
            )}

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {cat === 'all' ? '🏠 Wszystko' : `${getCategoryEmoji(cat as KitchenItem['category'])} ${getCategoryLabel(cat as KitchenItem['category'])}`}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                className={`relative overflow-hidden transition-all ${owned
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : canAfford
                                        ? 'hover:border-slate-600'
                                        : 'opacity-60'
                                    }`}
                            >
                                {/* Rarity Badge */}
                                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(item.rarity)}`}>
                                    {getRarityLabel(item.rarity)}
                                </div>

                                {/* Owned Badge */}
                                {owned && (
                                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                <CardContent className="pt-6">
                                    {/* Emoji */}
                                    <div className="text-5xl text-center mb-3">{item.emoji}</div>

                                    {/* Name & Description */}
                                    <h3 className="font-semibold text-center mb-1">{item.name}</h3>
                                    <p className="text-xs text-slate-400 text-center mb-3">{item.description}</p>

                                    {/* Effect if any */}
                                    {item.effect && (
                                        <div className="text-xs text-center text-purple-400 mb-3">
                                            ✨ {item.effect}
                                        </div>
                                    )}

                                    {/* Price & Action */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <Coins className="w-4 h-4 text-amber-400" />
                                            <span className="font-bold text-amber-400">{item.price}</span>
                                        </div>

                                        {owned ? (
                                            <span className="text-sm text-emerald-400">Posiadane</span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={!canAfford || purchasing === item.id}
                                                onClick={() => purchaseItem(item)}
                                            >
                                                {purchasing === item.id ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        ⏳
                                                    </motion.div>
                                                ) : !canAfford ? (
                                                    <Lock className="w-4 h-4" />
                                                ) : (
                                                    'Kup'
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
