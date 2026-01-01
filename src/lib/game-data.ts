import { KitchenItem } from '@/types';

export const KITCHEN_ITEMS: KitchenItem[] = [
    {
        id: 'coffee_machine',
        name: 'Ekspres do kawy',
        description: 'Daje energię do oszczędzania!',
        price: 500,
        emoji: '☕',
        category: 'appliance',
        rarity: 'common'
    },
    {
        id: 'gold_plant',
        name: 'Złoty Kwiatek',
        description: 'Rośnie razem z Twoimi oszczędnościami',
        price: 1200,
        emoji: '🪴',
        category: 'decoration',
        rarity: 'rare',
        effect: '+1% XP za każdy dzień streaku'
    },
    {
        id: 'piggy_bank_guard',
        name: 'Strażnik Skarbonki',
        description: 'Pilnuje, żebyś nie wydawał na głupoty',
        price: 2500,
        emoji: '👮‍♂️',
        category: 'companion',
        rarity: 'epic',
        effect: 'Ostrzega przed impulsywnymi zakupami'
    },
    {
        id: 'blender_turbo',
        name: 'Blender Turbo',
        description: 'Mieszaj oszczędności z inwestycjami',
        price: 800,
        emoji: '🌪️',
        category: 'appliance',
        rarity: 'uncommon'
    },
    {
        id: 'neon_sign',
        name: 'Neon "HODL"',
        description: 'Stylowe oświetlenie Twojej kuchni',
        price: 1500,
        emoji: '💡',
        category: 'decoration',
        rarity: 'rare'
    },
    {
        id: 'robo_chef',
        name: 'Robo-Chef',
        description: 'Gotuje tanie i zdrowe posiłki',
        price: 5000,
        emoji: '🤖',
        category: 'companion',
        rarity: 'legendary',
        effect: '-5% na wydatki spożywcze'
    }
];

export const getRarityColor = (rarity: string) => {
    switch (rarity) {
        case 'common': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        case 'uncommon': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case 'legendary': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        default: return 'bg-slate-500/20';
    }
};

export const getRarityLabel = (rarity: string) => {
    switch (rarity) {
        case 'common': return 'Pospolity';
        case 'uncommon': return 'Niecodzienny';
        case 'rare': return 'Rzadki';
        case 'epic': return 'Epicki';
        case 'legendary': return 'Legendarny';
        default: return rarity;
    }
};

export const getCategoryLabel = (category: string) => {
    switch (category) {
        case 'appliance': return 'Sprzęt';
        case 'decoration': return 'Dekoracje';
        case 'companion': return 'Towarzysze';
        case 'food': return 'Jedzenie';
        default: return category;
    }
};

export const getCategoryEmoji = (category: string) => {
    switch (category) {
        case 'appliance': return '🔌';
        case 'decoration': return '🖼️';
        case 'companion': return '🐾';
        case 'food': return '🍕';
        default: return '📦';
    }
};

export const calculateKitchenValue = (ownedIds: string[]) => {
    return ownedIds.reduce((total, id) => {
        const item = KITCHEN_ITEMS.find(i => i.id === id);
        return total + (item ? item.price : 0);
    }, 0);
};
