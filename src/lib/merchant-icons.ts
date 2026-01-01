/**
 * Smart Merchant Icon Mapper
 * Matches merchant names to appropriate emojis/icons
 */

// Category gradient backgrounds for cards
export const CATEGORY_GRADIENTS: Record<string, string> = {
    groceries: 'bg-gradient-to-br from-emerald-600/90 to-emerald-800/90',
    restaurants: 'bg-gradient-to-br from-orange-500/90 to-red-600/90',
    transport: 'bg-gradient-to-br from-blue-500/90 to-blue-700/90',
    utilities: 'bg-gradient-to-br from-yellow-500/90 to-amber-600/90',
    entertainment: 'bg-gradient-to-br from-purple-500/90 to-pink-600/90',
    shopping: 'bg-gradient-to-br from-pink-500/90 to-rose-600/90',
    health: 'bg-gradient-to-br from-red-500/90 to-rose-700/90',
    education: 'bg-gradient-to-br from-indigo-500/90 to-violet-700/90',
    subscriptions: 'bg-gradient-to-br from-violet-600/90 to-purple-800/90',
    other: 'bg-gradient-to-br from-slate-600/90 to-slate-800/90',
};

// Brand-specific emoji mapping
export const BRAND_ICONS: Record<string, string> = {
    // Sklepy spożywcze
    'żabka': '🐸',
    'zabka': '🐸',
    'biedronka': '🐞',
    'lidl': '🛒',
    'auchan': '🛒',
    'carrefour': '🛒',
    'tesco': '🛒',
    'kaufland': '🛒',
    'netto': '🛒',
    'dino': '🦕',
    'lewiatan': '🛒',
    'stokrotka': '🌼',
    'intermarche': '🛒',
    'makro': '📦',
    'selgros': '📦',

    // Fast food & Restauracje
    'mcdonalds': '🍔',
    "mcdonald's": '🍔',
    'kfc': '🍗',
    'burger king': '🍔',
    'subway': '🥪',
    'starbucks': '☕',
    'costa': '☕',
    'pizza hut': '🍕',
    'dominos': '🍕',
    "domino's": '🍕',
    'telepizza': '🍕',
    'pyszne': '🍽️',
    'uber eats': '🍽️',
    'glovo': '🛵',
    'wolt': '🛵',
    'kebab': '🥙',
    'sushi': '🍣',

    // Streaming & Subskrypcje
    'netflix': '🎬',
    'spotify': '🎵',
    'youtube': '▶️',
    'disney': '🏰',
    'hbo': '🎭',
    'apple': '🍎',
    'google': '🔵',
    'microsoft': '💻',
    'amazon': '📦',
    'prime': '📦',
    'allegro': '📦',

    // Paliwo & Transport
    'orlen': '⛽',
    'bp': '⛽',
    'shell': '⛽',
    'circle k': '⛽',
    'lotos': '⛽',
    'moya': '⛽',
    'amic': '⛽',
    'uber': '🚗',
    'bolt': '🚗',
    'freenow': '🚗',
    'itaxi': '🚕',
    'pkp': '🚂',
    'intercity': '🚂',
    'flixbus': '🚌',
    'polskibus': '🚌',

    // Telekomunikacja
    'orange': '📱',
    'play': '📱',
    't-mobile': '📱',
    'plus': '📱',
    'vectra': '📶',
    'upc': '📶',

    // Zdrowie & Uroda
    'rossmann': '💄',
    'hebe': '💄',
    'drogeria': '💄',
    'apteka': '💊',
    'pharmacy': '💊',
    'gemini': '💊',
    'doz': '💊',
    'super-pharm': '💊',

    // Sport & Rozrywka
    'decathlon': '🏃',
    'sport': '⚽',
    'fitness': '💪',
    'multikino': '🎬',
    'cinema city': '🎬',
    'helios': '🎬',
    'kino': '🎬',

    // Elektronika
    'media markt': '📺',
    'media expert': '📺',
    'rtv euro': '📺',
    'euro agd': '📺',
    'x-kom': '💻',
    'morele': '💻',
    'komputronik': '💻',

    // Moda
    'zara': '👗',
    'h&m': '👕',
    'reserved': '👔',
    'house': '👕',
    'cropp': '👕',
    'sinsay': '👗',
    'mohito': '👗',
    'ccc': '👟',
    'deichmann': '👟',
    'nike': '👟',
    'adidas': '👟',

    // Dom & Ogród
    'ikea': '🛋️',
    'castorama': '🔨',
    'leroy merlin': '🔨',
    'obi': '🔨',
    'jysk': '🛏️',
    'pepco': '🏠',
    'action': '🏠',
    'tedi': '🏠',

    // Finanse
    'bank': '🏦',
    'pko': '🏦',
    'mbank': '🏦',
    'ing': '🏦',
    'santander': '🏦',
    'ubezpieczenie': '🛡️',
    'pzu': '🛡️',
    'warta': '🛡️',

    // Edukacja
    'uniwersytet': '🎓',
    'szkoła': '📚',
    'uczelnia': '🎓',
    'studia': '🎓',
    'kursy': '📖',
    'udemy': '📖',
    'coursera': '📖',

    // Generic patterns
    'cafe': '☕',
    'kawiarnia': '☕',
    'bar': '🍺',
    'pub': '🍺',
    'restauracja': '🍽️',
    'hotel': '🏨',
    'parking': '🅿️',
    'bilet': '🎫',
    'lekarz': '👨‍⚕️',
    'dentysta': '🦷',
    'fryzjer': '💇',
    'salon': '💇',
};

// Category fallback icons (if no brand match)
export const CATEGORY_EMOJI: Record<string, string> = {
    groceries: '🛒',
    restaurants: '🍽️',
    transport: '🚗',
    utilities: '💡',
    entertainment: '🎮',
    shopping: '🛍️',
    health: '💊',
    education: '📚',
    subscriptions: '📺',
    other: '📦',
};

/**
 * Get the best matching icon for a merchant
 */
export function getMerchantIcon(merchantName: string, category?: string): string {
    if (!merchantName) {
        return category ? (CATEGORY_EMOJI[category] || '📦') : '📦';
    }

    const lowerName = merchantName.toLowerCase();

    // Check for exact or partial brand matches
    for (const [brand, emoji] of Object.entries(BRAND_ICONS)) {
        if (lowerName.includes(brand)) {
            return emoji;
        }
    }

    // Fallback to category
    if (category && CATEGORY_EMOJI[category]) {
        return CATEGORY_EMOJI[category];
    }

    return '📦';
}

/**
 * Get merchant color based on brand/category
 */
export function getMerchantColor(merchantName: string, category?: string): string {
    const lowerName = merchantName?.toLowerCase() || '';

    // Brand-specific colors
    if (lowerName.includes('żabka') || lowerName.includes('zabka')) return 'bg-green-500';
    if (lowerName.includes('biedronka')) return 'bg-red-500';
    if (lowerName.includes('mcdonalds') || lowerName.includes("mcdonald's")) return 'bg-yellow-500';
    if (lowerName.includes('netflix')) return 'bg-red-600';
    if (lowerName.includes('spotify')) return 'bg-green-500';
    if (lowerName.includes('orlen')) return 'bg-red-500';
    if (lowerName.includes('shell')) return 'bg-yellow-500';
    if (lowerName.includes('starbucks')) return 'bg-green-600';

    // Category colors
    const categoryColors: Record<string, string> = {
        groceries: 'bg-emerald-500/20',
        restaurants: 'bg-orange-500/20',
        transport: 'bg-blue-500/20',
        utilities: 'bg-yellow-500/20',
        entertainment: 'bg-purple-500/20',
        shopping: 'bg-pink-500/20',
        health: 'bg-red-500/20',
        education: 'bg-indigo-500/20',
        subscriptions: 'bg-violet-500/20',
        other: 'bg-slate-500/20',
    };

    return category ? (categoryColors[category] || 'bg-slate-700/50') : 'bg-slate-700/50';
}

/**
 * Clean and beautify merchant names
 */
export function cleanMerchantName(name: string): string {
    if (!name) return 'Nieznany';

    // Common Polish merchant patterns to remove
    const cleanups = [
        /\s*sp\.?\s*z\s*o\.?o\.?/gi,
        /\s*s\.?a\.?$/gi,
        /\s*polska?\s*/gi,
        /\s*\d{5,}/g, // Remove long numbers
        /\s+ul\.?\s+[\w\s]+\d*/gi, // Remove addresses
        /\s+\d+\s*$/g, // Trailing numbers
        /\s{2,}/g, // Multiple spaces
        /\s*sbx\s*/gi,
        /\s*aveni\s*/gi,
        /\s*pl\s*$/gi,
    ];

    let cleaned = name;
    for (const pattern of cleanups) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    // Trim and capitalize
    cleaned = cleaned.trim();

    // Known brand fixes
    const brandFixes: Record<string, string> = {
        'zabka': 'Żabka',
        'żabka': 'Żabka',
        'mcdonalds': "McDonald's",
        'mcdonald': "McDonald's",
        'kfc': 'KFC',
        'lidl': 'Lidl',
        'biedronka': 'Biedronka',
        'orlen': 'Orlen',
        'netflix': 'Netflix',
        'spotify': 'Spotify',
        'allegro': 'Allegro',
        'uber': 'Uber',
        'bolt': 'Bolt',
        'starbucks': 'Starbucks',
        'rossmann': 'Rossmann',
        'hebe': 'Hebe',
        'ikea': 'IKEA',
        'decathlon': 'Decathlon',
        'empik': 'Empik',
        'media markt': 'MediaMarkt',
        'media expert': 'Media Expert',
        'castorama': 'Castorama',
        'leroy merlin': 'Leroy Merlin',
        'pepco': 'Pepco',
        'action': 'Action',
        'reserved': 'Reserved',
        'h&m': 'H&M',
        'zara': 'Zara',
    };

    const lowerCleaned = cleaned.toLowerCase();
    for (const [from, to] of Object.entries(brandFixes)) {
        if (lowerCleaned.includes(from)) {
            return to;
        }
    }

    // Capitalize first letter of each word
    return cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || 'Nieznany';
}

