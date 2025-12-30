/**
 * Known Subscription Services Database
 * Auto-detection of popular services when scanning receipts/statements
 */

export interface KnownSubscription {
    name: string;
    aliases: string[];           // Alternative names to match
    category: 'subscriptions' | 'entertainment' | 'utilities';
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    emoji: string;
    avgPrice?: number;           // Expected price range (grosze)
    color: string;
}

// Database of known subscription services
export const KNOWN_SUBSCRIPTIONS: Record<string, KnownSubscription> = {
    // Streaming Video
    'netflix': {
        name: 'Netflix',
        aliases: ['netflix', 'netflix.com', 'netflix inc'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📺',
        avgPrice: 4300,
        color: '#E50914',
    },
    'disney+': {
        name: 'Disney+',
        aliases: ['disney+', 'disney plus', 'disneyplus', 'walt disney'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🏰',
        avgPrice: 2890,
        color: '#113CCF',
    },
    'hbo': {
        name: 'HBO Max',
        aliases: ['hbo', 'hbo max', 'hbomax', 'max.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📺',
        avgPrice: 2990,
        color: '#5822B4',
    },
    'prime': {
        name: 'Amazon Prime',
        aliases: ['amazon prime', 'prime video', 'amzn prime', 'amazon.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📦',
        avgPrice: 4900,
        color: '#FF9900',
    },
    'youtube': {
        name: 'YouTube Premium',
        aliases: ['youtube', 'youtube premium', 'youtube music', 'google youtube'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '▶️',
        avgPrice: 2390,
        color: '#FF0000',
    },
    'canal+': {
        name: 'Canal+',
        aliases: ['canal+', 'canal plus', 'canalplus'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📺',
        avgPrice: 6000,
        color: '#000000',
    },
    'player': {
        name: 'Player',
        aliases: ['player', 'player.pl', 'tvn player'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📺',
        avgPrice: 2000,
        color: '#E31837',
    },

    // Streaming Music
    'spotify': {
        name: 'Spotify',
        aliases: ['spotify', 'spotify ab', 'spotify.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎵',
        avgPrice: 1999,
        color: '#1DB954',
    },
    'apple_music': {
        name: 'Apple Music',
        aliases: ['apple music', 'itunes', 'apple.com/bill'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🍎',
        avgPrice: 1999,
        color: '#FC3C44',
    },
    'tidal': {
        name: 'Tidal',
        aliases: ['tidal', 'tidal.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎵',
        avgPrice: 1999,
        color: '#000000',
    },
    'deezer': {
        name: 'Deezer',
        aliases: ['deezer', 'deezer.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎵',
        avgPrice: 1999,
        color: '#FEAA2D',
    },

    // Gaming
    'xbox': {
        name: 'Xbox Game Pass',
        aliases: ['xbox', 'xbox game pass', 'microsoft xbox', 'game pass'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎮',
        avgPrice: 5499,
        color: '#107C10',
    },
    'playstation': {
        name: 'PlayStation Plus',
        aliases: ['playstation', 'ps plus', 'psn', 'playstation network', 'sony playstation'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎮',
        avgPrice: 4000,
        color: '#003791',
    },
    'nintendo': {
        name: 'Nintendo Switch Online',
        aliases: ['nintendo', 'nintendo switch online', 'nso'],
        category: 'subscriptions',
        frequency: 'yearly',
        emoji: '🎮',
        avgPrice: 8000,
        color: '#E60012',
    },
    'ea_play': {
        name: 'EA Play',
        aliases: ['ea play', 'ea.com', 'electronic arts'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎮',
        avgPrice: 1499,
        color: '#000000',
    },

    // Cloud & Productivity
    'icloud': {
        name: 'iCloud+',
        aliases: ['icloud', 'apple.com/bill', 'icloud+'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '☁️',
        avgPrice: 399,
        color: '#3693F3',
    },
    'google_one': {
        name: 'Google One',
        aliases: ['google one', 'google storage', 'google.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '☁️',
        avgPrice: 899,
        color: '#4285F4',
    },
    'dropbox': {
        name: 'Dropbox',
        aliases: ['dropbox', 'dropbox.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📁',
        avgPrice: 4999,
        color: '#0061FF',
    },
    'microsoft_365': {
        name: 'Microsoft 365',
        aliases: ['microsoft 365', 'office 365', 'microsoft.com', 'ms office'],
        category: 'subscriptions',
        frequency: 'yearly',
        emoji: '📊',
        avgPrice: 29900,
        color: '#D83B01',
    },
    'notion': {
        name: 'Notion',
        aliases: ['notion', 'notion.so'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '📝',
        avgPrice: 800,
        color: '#000000',
    },

    // AI & Tools
    'chatgpt': {
        name: 'ChatGPT Plus',
        aliases: ['chatgpt', 'openai', 'openai.com', 'chatgpt plus'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🤖',
        avgPrice: 8000,
        color: '#10A37F',
    },
    'claude': {
        name: 'Claude Pro',
        aliases: ['claude', 'anthropic', 'claude.ai'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🤖',
        avgPrice: 8000,
        color: '#D4A574',
    },
    'midjourney': {
        name: 'Midjourney',
        aliases: ['midjourney', 'midjourney.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎨',
        avgPrice: 1000,
        color: '#000000',
    },

    // Creative
    'adobe': {
        name: 'Adobe Creative Cloud',
        aliases: ['adobe', 'adobe.com', 'creative cloud', 'photoshop', 'lightroom'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎨',
        avgPrice: 5500,
        color: '#FF0000',
    },
    'canva': {
        name: 'Canva Pro',
        aliases: ['canva', 'canva.com', 'canva pro'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎨',
        avgPrice: 5499,
        color: '#00C4CC',
    },
    'figma': {
        name: 'Figma',
        aliases: ['figma', 'figma.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🎨',
        avgPrice: 1500,
        color: '#F24E1E',
    },

    // E-commerce
    'allegro': {
        name: 'Allegro Smart',
        aliases: ['allegro smart', 'allegro.pl', 'allegro'],
        category: 'subscriptions',
        frequency: 'yearly',
        emoji: '🛒',
        avgPrice: 4990,
        color: '#FF5A00',
    },

    // VPN & Security
    'nordvpn': {
        name: 'NordVPN',
        aliases: ['nordvpn', 'nord vpn', 'nordvpn.com'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🔒',
        avgPrice: 4999,
        color: '#4687FF',
    },
    'expressvpn': {
        name: 'ExpressVPN',
        aliases: ['expressvpn', 'express vpn'],
        category: 'subscriptions',
        frequency: 'monthly',
        emoji: '🔒',
        avgPrice: 5299,
        color: '#DA3940',
    },

    // Utilities (Polish)
    'pge': {
        name: 'PGE (Prąd)',
        aliases: ['pge', 'pge obrót', 'pge energia'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '⚡',
        color: '#00A650',
    },
    'enea': {
        name: 'Enea (Prąd)',
        aliases: ['enea', 'enea s.a.'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '⚡',
        color: '#00529B',
    },
    'tauron': {
        name: 'Tauron (Prąd)',
        aliases: ['tauron', 'tauron sprzedaż'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '⚡',
        color: '#512D6D',
    },
    'pgnig': {
        name: 'PGNiG (Gaz)',
        aliases: ['pgnig', 'pgnig obrót', 'polskie górnictwo naftowe'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '🔥',
        color: '#004B87',
    },

    // Telecom (Polish)
    'orange': {
        name: 'Orange',
        aliases: ['orange', 'orange polska', 'tp s.a.'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '📱',
        color: '#FF6600',
    },
    'play': {
        name: 'Play',
        aliases: ['play', 'p4 sp', 'play.pl'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '📱',
        color: '#6D2077',
    },
    'plus': {
        name: 'Plus',
        aliases: ['plus', 'polkomtel', 'plus gsm'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '📱',
        color: '#00A651',
    },
    't_mobile': {
        name: 'T-Mobile',
        aliases: ['t-mobile', 'tmobile', 't mobile polska'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '📱',
        color: '#E20074',
    },
    'upc': {
        name: 'UPC / Play Internet',
        aliases: ['upc', 'upc polska', 'play internet'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '📡',
        color: '#E20074',
    },
    'vectra': {
        name: 'Vectra',
        aliases: ['vectra', 'vectra s.a.'],
        category: 'utilities',
        frequency: 'monthly',
        emoji: '📡',
        color: '#009FE3',
    },
};

/**
 * Detect if a merchant name matches a known subscription service
 */
export function detectSubscription(merchantName: string): KnownSubscription | null {
    if (!merchantName) return null;

    const normalized = merchantName.toLowerCase().trim();

    for (const [key, subscription] of Object.entries(KNOWN_SUBSCRIPTIONS)) {
        // Check main key
        if (normalized.includes(key)) {
            return subscription;
        }

        // Check aliases
        for (const alias of subscription.aliases) {
            if (normalized.includes(alias.toLowerCase())) {
                return subscription;
            }
        }
    }

    return null;
}

/**
 * Get all subscriptions for a category
 */
export function getSubscriptionsByCategory(category: string): KnownSubscription[] {
    return Object.values(KNOWN_SUBSCRIPTIONS).filter(s => s.category === category);
}

/**
 * Search subscriptions by name
 */
export function searchSubscriptions(query: string): KnownSubscription[] {
    const normalized = query.toLowerCase().trim();

    return Object.values(KNOWN_SUBSCRIPTIONS).filter(s =>
        s.name.toLowerCase().includes(normalized) ||
        s.aliases.some(a => a.toLowerCase().includes(normalized))
    );
}
