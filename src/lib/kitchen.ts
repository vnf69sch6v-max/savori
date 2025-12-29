/**
 * Savori Virtual Kitchen System
 * Sklep z przedmiotami za punkty + kolekcja użytkownika
 */

export interface KitchenItem {
    id: string;
    name: string;
    emoji: string;
    description: string;
    price: number;
    category: 'appliance' | 'decoration' | 'companion' | 'food';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    effect?: string;
}

export const KITCHEN_ITEMS: KitchenItem[] = [
    // Appliances
    {
        id: 'kettle',
        name: 'Czajnik',
        emoji: '🫖',
        description: 'Podstawowy sprzęt każdej kuchni',
        price: 100,
        category: 'appliance',
        rarity: 'common',
    },
    {
        id: 'toaster',
        name: 'Toster',
        emoji: '🍞',
        description: 'Chrupiące tosty na śniadanie',
        price: 200,
        category: 'appliance',
        rarity: 'common',
    },
    {
        id: 'coffee_machine',
        name: 'Ekspres do kawy',
        emoji: '☕',
        description: 'Domowa kawa = zaoszczędzone pieniądze!',
        price: 500,
        category: 'appliance',
        rarity: 'rare',
        effect: 'Odblokuj wyzwanie "Domowy Barista"',
    },
    {
        id: 'blender',
        name: 'Blender',
        emoji: '🥤',
        description: 'Smoothie zamiast drogich soków',
        price: 400,
        category: 'appliance',
        rarity: 'rare',
    },
    {
        id: 'oven',
        name: 'Piekarnik',
        emoji: '🍕',
        description: 'Domowa pizza lepsza niż z dostawy',
        price: 800,
        category: 'appliance',
        rarity: 'epic',
        effect: '+10% punktów za gotowanie',
    },
    {
        id: 'golden_pan',
        name: 'Złota Patelnia',
        emoji: '🍳',
        description: 'Legendarny przedmiot mistrzów oszczędzania',
        price: 2000,
        category: 'appliance',
        rarity: 'legendary',
        effect: '+25% punktów za wszystkie akcje',
    },

    // Decorations
    {
        id: 'plant',
        name: 'Roślinka',
        emoji: '🌱',
        description: 'Zieleń w kuchni poprawia nastrój',
        price: 150,
        category: 'decoration',
        rarity: 'common',
    },
    {
        id: 'flowers',
        name: 'Kwiaty',
        emoji: '💐',
        description: 'Piękno za grosze',
        price: 250,
        category: 'decoration',
        rarity: 'common',
    },
    {
        id: 'clock',
        name: 'Zegar',
        emoji: '🕐',
        description: 'Czas to pieniądz!',
        price: 300,
        category: 'decoration',
        rarity: 'rare',
    },
    {
        id: 'painting',
        name: 'Obrazek',
        emoji: '🖼️',
        description: 'Sztuka w kuchni',
        price: 500,
        category: 'decoration',
        rarity: 'rare',
    },
    {
        id: 'chandelier',
        name: 'Żyrandol',
        emoji: '✨',
        description: 'Luksusowe oświetlenie',
        price: 1500,
        category: 'decoration',
        rarity: 'epic',
    },

    // Companions
    {
        id: 'goldfish',
        name: 'Złota rybka',
        emoji: '🐠',
        description: 'Cichy towarzysz',
        price: 300,
        category: 'companion',
        rarity: 'common',
    },
    {
        id: 'cat',
        name: 'Kot kuchenny',
        emoji: '🐱',
        description: 'Mruczy gdy oszczędzasz',
        price: 1000,
        category: 'companion',
        rarity: 'epic',
        effect: 'Losowe bonusy punktów',
    },
    {
        id: 'dragon',
        name: 'Mini smok',
        emoji: '🐉',
        description: 'Legendarny strażnik oszczędności',
        price: 5000,
        category: 'companion',
        rarity: 'legendary',
        effect: 'x2 punkty w weekendy',
    },

    // Food items (cosmetic trophies)
    {
        id: 'fruit_bowl',
        name: 'Miska owoców',
        emoji: '🍎',
        description: 'Symbol zdrowych wyborów',
        price: 200,
        category: 'food',
        rarity: 'common',
    },
    {
        id: 'cake',
        name: 'Tort',
        emoji: '🎂',
        description: 'Nagroda za ciężką pracę',
        price: 400,
        category: 'food',
        rarity: 'rare',
    },
    {
        id: 'sushi',
        name: 'Zestaw sushi',
        emoji: '🍣',
        description: 'Ekskluzywne smaki',
        price: 600,
        category: 'food',
        rarity: 'rare',
    },
    {
        id: 'crown_cake',
        name: 'Królewski tort',
        emoji: '👑',
        description: 'Dla prawdziwych mistrzów',
        price: 3000,
        category: 'food',
        rarity: 'legendary',
    },
];

// User's kitchen state
export interface UserKitchen {
    ownedItems: string[]; // item IDs
    equippedItems: string[]; // currently displayed
    totalSpent: number;
}

// Helper functions
export function getItemById(id: string): KitchenItem | undefined {
    return KITCHEN_ITEMS.find(item => item.id === id);
}

export function getItemsByCategory(category: KitchenItem['category']): KitchenItem[] {
    return KITCHEN_ITEMS.filter(item => item.category === category);
}

export function getItemsByRarity(rarity: KitchenItem['rarity']): KitchenItem[] {
    return KITCHEN_ITEMS.filter(item => item.rarity === rarity);
}

export function getRarityColor(rarity: KitchenItem['rarity']): string {
    switch (rarity) {
        case 'common': return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
        case 'rare': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
        case 'epic': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
        case 'legendary': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
}

export function getRarityLabel(rarity: KitchenItem['rarity']): string {
    switch (rarity) {
        case 'common': return 'Zwykły';
        case 'rare': return 'Rzadki';
        case 'epic': return 'Epicki';
        case 'legendary': return 'Legendarny';
    }
}

export function getCategoryLabel(category: KitchenItem['category']): string {
    switch (category) {
        case 'appliance': return 'Sprzęty';
        case 'decoration': return 'Dekoracje';
        case 'companion': return 'Towarzysze';
        case 'food': return 'Jedzenie';
    }
}

export function getCategoryEmoji(category: KitchenItem['category']): string {
    switch (category) {
        case 'appliance': return '🔌';
        case 'decoration': return '🎨';
        case 'companion': return '🐾';
        case 'food': return '🍽️';
    }
}

// Calculate kitchen "value" for display
export function calculateKitchenValue(ownedItems: string[]): number {
    return ownedItems.reduce((total, id) => {
        const item = getItemById(id);
        return total + (item?.price || 0);
    }, 0);
}

// Get user's bonus multiplier from owned items
export function calculateBonusMultiplier(ownedItems: string[]): number {
    let multiplier = 1;

    if (ownedItems.includes('golden_pan')) multiplier += 0.25;
    if (ownedItems.includes('oven')) multiplier += 0.10;

    return multiplier;
}
