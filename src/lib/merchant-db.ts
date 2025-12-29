/**
 * Savori Merchant Database
 * Globalna baza merchantów z mapowaniem na kategorie
 */

import { ExpenseCategory } from '@/types';

export interface MerchantMapping {
    patterns: RegExp;
    merchantName: string;
    category: ExpenseCategory;
    subCategory?: string;
    confidence: number;
}

// Polska baza merchantów - rozbudowana
export const MERCHANT_DATABASE: MerchantMapping[] = [
    // ============ GROCERIES ============
    // Supermarkety
    { patterns: /biedronka/i, merchantName: 'Biedronka', category: 'groceries', subCategory: 'supermarket', confidence: 0.98 },
    { patterns: /lidl/i, merchantName: 'Lidl', category: 'groceries', subCategory: 'supermarket', confidence: 0.98 },
    { patterns: /kaufland/i, merchantName: 'Kaufland', category: 'groceries', subCategory: 'supermarket', confidence: 0.98 },
    { patterns: /auchan/i, merchantName: 'Auchan', category: 'groceries', subCategory: 'supermarket', confidence: 0.98 },
    { patterns: /carrefour/i, merchantName: 'Carrefour', category: 'groceries', subCategory: 'supermarket', confidence: 0.98 },
    { patterns: /tesco/i, merchantName: 'Tesco', category: 'groceries', subCategory: 'supermarket', confidence: 0.98 },
    { patterns: /netto/i, merchantName: 'Netto', category: 'groceries', subCategory: 'supermarket', confidence: 0.95 },
    { patterns: /intermarche|intermarch/i, merchantName: 'Intermarché', category: 'groceries', subCategory: 'supermarket', confidence: 0.95 },
    { patterns: /e\.?leclerc|leclerc/i, merchantName: 'E.Leclerc', category: 'groceries', subCategory: 'supermarket', confidence: 0.95 },

    // Dyskonty / convenience
    { patterns: /żabka|zabka/i, merchantName: 'Żabka', category: 'groceries', subCategory: 'convenience', confidence: 0.95 },
    { patterns: /lewiatan/i, merchantName: 'Lewiatan', category: 'groceries', subCategory: 'convenience', confidence: 0.90 },
    { patterns: /dino\s/i, merchantName: 'Dino', category: 'groceries', subCategory: 'supermarket', confidence: 0.90 },
    { patterns: /stokrotka/i, merchantName: 'Stokrotka', category: 'groceries', subCategory: 'supermarket', confidence: 0.90 },
    { patterns: /polo\s?market/i, merchantName: 'Polo Market', category: 'groceries', subCategory: 'supermarket', confidence: 0.90 },
    { patterns: /freshmarket|fresh\s?market/i, merchantName: 'Freshmarket', category: 'groceries', subCategory: 'convenience', confidence: 0.85 },

    // Hurtownie
    { patterns: /makro/i, merchantName: 'Makro', category: 'groceries', subCategory: 'wholesale', confidence: 0.90 },
    { patterns: /selgros/i, merchantName: 'Selgros', category: 'groceries', subCategory: 'wholesale', confidence: 0.90 },

    // ============ RESTAURANTS ============
    // Fast food
    { patterns: /mcdonald|mcdonalds|mcd\s/i, merchantName: 'McDonald\'s', category: 'restaurants', subCategory: 'fast_food', confidence: 0.98 },
    { patterns: /kfc/i, merchantName: 'KFC', category: 'restaurants', subCategory: 'fast_food', confidence: 0.98 },
    { patterns: /burger\s?king/i, merchantName: 'Burger King', category: 'restaurants', subCategory: 'fast_food', confidence: 0.98 },
    { patterns: /subway/i, merchantName: 'Subway', category: 'restaurants', subCategory: 'fast_food', confidence: 0.95 },
    { patterns: /pizza\s?hut/i, merchantName: 'Pizza Hut', category: 'restaurants', subCategory: 'fast_food', confidence: 0.95 },
    { patterns: /dominos|domino'?s/i, merchantName: 'Domino\'s', category: 'restaurants', subCategory: 'fast_food', confidence: 0.95 },
    { patterns: /telepizza/i, merchantName: 'Telepizza', category: 'restaurants', subCategory: 'fast_food', confidence: 0.95 },
    { patterns: /north\s?fish/i, merchantName: 'North Fish', category: 'restaurants', subCategory: 'fast_food', confidence: 0.90 },
    { patterns: /max\s?premium\s?burgers|max\s?burgers/i, merchantName: 'Max Premium Burgers', category: 'restaurants', subCategory: 'fast_food', confidence: 0.90 },

    // Kawiarnie
    { patterns: /starbucks/i, merchantName: 'Starbucks', category: 'restaurants', subCategory: 'cafe', confidence: 0.98 },
    { patterns: /costa\s?coffee/i, merchantName: 'Costa Coffee', category: 'restaurants', subCategory: 'cafe', confidence: 0.95 },
    { patterns: /green\s?caff/i, merchantName: 'Green Caffè Nero', category: 'restaurants', subCategory: 'cafe', confidence: 0.95 },
    { patterns: /caff.?\s?nero/i, merchantName: 'Caffè Nero', category: 'restaurants', subCategory: 'cafe', confidence: 0.90 },
    { patterns: /mcdonald.*mccafe|mccafe/i, merchantName: 'McCafé', category: 'restaurants', subCategory: 'cafe', confidence: 0.90 },
    { patterns: /cafe\s?nero|coffee\s?heaven/i, merchantName: 'Coffee Heaven', category: 'restaurants', subCategory: 'cafe', confidence: 0.85 },

    // Delivery
    { patterns: /uber\s?eats/i, merchantName: 'Uber Eats', category: 'restaurants', subCategory: 'delivery', confidence: 0.98 },
    { patterns: /pyszne\.?pl|pyszne/i, merchantName: 'Pyszne.pl', category: 'restaurants', subCategory: 'delivery', confidence: 0.98 },
    { patterns: /glovo/i, merchantName: 'Glovo', category: 'restaurants', subCategory: 'delivery', confidence: 0.95 },
    { patterns: /wolt/i, merchantName: 'Wolt', category: 'restaurants', subCategory: 'delivery', confidence: 0.95 },
    { patterns: /bolt\s?food/i, merchantName: 'Bolt Food', category: 'restaurants', subCategory: 'delivery', confidence: 0.95 },

    // ============ TRANSPORT ============
    // Paliwo
    { patterns: /orlen/i, merchantName: 'Orlen', category: 'transport', subCategory: 'fuel', confidence: 0.95 },
    { patterns: /bp\s|bp$/i, merchantName: 'BP', category: 'transport', subCategory: 'fuel', confidence: 0.90 },
    { patterns: /shell/i, merchantName: 'Shell', category: 'transport', subCategory: 'fuel', confidence: 0.95 },
    { patterns: /circle\s?k/i, merchantName: 'Circle K', category: 'transport', subCategory: 'fuel', confidence: 0.90 },
    { patterns: /lotos/i, merchantName: 'Lotos', category: 'transport', subCategory: 'fuel', confidence: 0.95 },
    { patterns: /amic/i, merchantName: 'Amic', category: 'transport', subCategory: 'fuel', confidence: 0.85 },
    { patterns: /moya/i, merchantName: 'Moya', category: 'transport', subCategory: 'fuel', confidence: 0.85 },

    // Ride-hailing
    { patterns: /uber(?!\s?eats)/i, merchantName: 'Uber', category: 'transport', subCategory: 'rideshare', confidence: 0.95 },
    { patterns: /bolt(?!\s?food)/i, merchantName: 'Bolt', category: 'transport', subCategory: 'rideshare', confidence: 0.95 },
    { patterns: /freenow|free\s?now|mytaxi/i, merchantName: 'FREE NOW', category: 'transport', subCategory: 'rideshare', confidence: 0.95 },

    // Transport publiczny
    { patterns: /pkp/i, merchantName: 'PKP', category: 'transport', subCategory: 'public', confidence: 0.90 },
    { patterns: /mpk/i, merchantName: 'MPK', category: 'transport', subCategory: 'public', confidence: 0.85 },
    { patterns: /ztm/i, merchantName: 'ZTM', category: 'transport', subCategory: 'public', confidence: 0.85 },
    { patterns: /flixbus/i, merchantName: 'FlixBus', category: 'transport', subCategory: 'public', confidence: 0.95 },
    { patterns: /polskibus/i, merchantName: 'PolskiBus', category: 'transport', subCategory: 'public', confidence: 0.95 },

    // Parking
    { patterns: /parking|parkometr/i, merchantName: 'Parking', category: 'transport', subCategory: 'parking', confidence: 0.80 },

    // ============ HEALTH ============
    { patterns: /apteka|pharmacy/i, merchantName: 'Apteka', category: 'health', subCategory: 'pharmacy', confidence: 0.90 },
    { patterns: /rossmann/i, merchantName: 'Rossmann', category: 'health', subCategory: 'drugstore', confidence: 0.85 },
    { patterns: /hebe/i, merchantName: 'Hebe', category: 'health', subCategory: 'drugstore', confidence: 0.85 },
    { patterns: /doz|dbam\s?o\s?zdrowie/i, merchantName: 'DOZ', category: 'health', subCategory: 'pharmacy', confidence: 0.90 },
    { patterns: /super.?pharm/i, merchantName: 'Super-Pharm', category: 'health', subCategory: 'pharmacy', confidence: 0.90 },
    { patterns: /gemini|apteka\s?gemini/i, merchantName: 'Gemini', category: 'health', subCategory: 'pharmacy', confidence: 0.90 },
    { patterns: /ziko/i, merchantName: 'Ziko', category: 'health', subCategory: 'pharmacy', confidence: 0.90 },
    { patterns: /medicover/i, merchantName: 'Medicover', category: 'health', subCategory: 'medical', confidence: 0.95 },
    { patterns: /luxmed|lux\s?med/i, merchantName: 'LuxMed', category: 'health', subCategory: 'medical', confidence: 0.95 },
    { patterns: /enel.?med/i, merchantName: 'Enel-Med', category: 'health', subCategory: 'medical', confidence: 0.95 },

    // ============ SHOPPING ============
    // Elektronika
    { patterns: /media\s?markt/i, merchantName: 'Media Markt', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },
    { patterns: /rtv\s?euro\s?agd/i, merchantName: 'RTV Euro AGD', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },
    { patterns: /media\s?expert/i, merchantName: 'Media Expert', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },
    { patterns: /x-?kom/i, merchantName: 'x-kom', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },
    { patterns: /morele\.?net|morele/i, merchantName: 'Morele.net', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },
    { patterns: /komputronik/i, merchantName: 'Komputronik', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },
    { patterns: /apple\s?store|apple\.com/i, merchantName: 'Apple', category: 'shopping', subCategory: 'electronics', confidence: 0.95 },

    // Odzież
    { patterns: /h\s?&\s?m|h&m/i, merchantName: 'H&M', category: 'shopping', subCategory: 'clothing', confidence: 0.95 },
    { patterns: /zara/i, merchantName: 'Zara', category: 'shopping', subCategory: 'clothing', confidence: 0.95 },
    { patterns: /reserved/i, merchantName: 'Reserved', category: 'shopping', subCategory: 'clothing', confidence: 0.95 },
    { patterns: /cropp/i, merchantName: 'Cropp', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },
    { patterns: /house\s?brand|house\s/i, merchantName: 'House', category: 'shopping', subCategory: 'clothing', confidence: 0.85 },
    { patterns: /sinsay/i, merchantName: 'Sinsay', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },
    { patterns: /mohito/i, merchantName: 'Mohito', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },
    { patterns: /zalando/i, merchantName: 'Zalando', category: 'shopping', subCategory: 'clothing', confidence: 0.95 },
    { patterns: /answear/i, merchantName: 'Answear', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },
    { patterns: /eobuwie/i, merchantName: 'eobuwie', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },
    { patterns: /ccc\s|ccc$/i, merchantName: 'CCC', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },
    { patterns: /deichmann/i, merchantName: 'Deichmann', category: 'shopping', subCategory: 'clothing', confidence: 0.90 },

    // Dom i meble
    { patterns: /ikea/i, merchantName: 'IKEA', category: 'shopping', subCategory: 'home', confidence: 0.98 },
    { patterns: /jysk/i, merchantName: 'JYSK', category: 'shopping', subCategory: 'home', confidence: 0.95 },
    { patterns: /agata\s?meble|agata/i, merchantName: 'Agata Meble', category: 'shopping', subCategory: 'home', confidence: 0.90 },
    { patterns: /black\s?red\s?white|brw/i, merchantName: 'Black Red White', category: 'shopping', subCategory: 'home', confidence: 0.90 },
    { patterns: /leroy\s?merlin/i, merchantName: 'Leroy Merlin', category: 'shopping', subCategory: 'home', confidence: 0.95 },
    { patterns: /castorama/i, merchantName: 'Castorama', category: 'shopping', subCategory: 'home', confidence: 0.95 },
    { patterns: /obi\s/i, merchantName: 'OBI', category: 'shopping', subCategory: 'home', confidence: 0.90 },
    { patterns: /bricomarche/i, merchantName: 'Bricomarché', category: 'shopping', subCategory: 'home', confidence: 0.90 },

    // Marketplace
    { patterns: /allegro/i, merchantName: 'Allegro', category: 'shopping', subCategory: 'marketplace', confidence: 0.90 },
    { patterns: /amazon/i, merchantName: 'Amazon', category: 'shopping', subCategory: 'marketplace', confidence: 0.90 },
    { patterns: /aliexpress/i, merchantName: 'AliExpress', category: 'shopping', subCategory: 'marketplace', confidence: 0.90 },

    // Książki / media
    { patterns: /empik/i, merchantName: 'Empik', category: 'shopping', subCategory: 'media', confidence: 0.95 },

    // ============ SUBSCRIPTIONS ============
    { patterns: /netflix/i, merchantName: 'Netflix', category: 'subscriptions', subCategory: 'streaming', confidence: 0.98 },
    { patterns: /spotify/i, merchantName: 'Spotify', category: 'subscriptions', subCategory: 'streaming', confidence: 0.98 },
    { patterns: /hbo\s?max|hbo/i, merchantName: 'HBO Max', category: 'subscriptions', subCategory: 'streaming', confidence: 0.95 },
    { patterns: /disney\s?\+|disney\s?plus/i, merchantName: 'Disney+', category: 'subscriptions', subCategory: 'streaming', confidence: 0.95 },
    { patterns: /amazon\s?prime/i, merchantName: 'Amazon Prime', category: 'subscriptions', subCategory: 'streaming', confidence: 0.95 },
    { patterns: /youtube\s?premium/i, merchantName: 'YouTube Premium', category: 'subscriptions', subCategory: 'streaming', confidence: 0.95 },
    { patterns: /apple\s?music/i, merchantName: 'Apple Music', category: 'subscriptions', subCategory: 'streaming', confidence: 0.95 },
    { patterns: /apple\s?tv/i, merchantName: 'Apple TV+', category: 'subscriptions', subCategory: 'streaming', confidence: 0.95 },
    { patterns: /tidal/i, merchantName: 'Tidal', category: 'subscriptions', subCategory: 'streaming', confidence: 0.90 },
    { patterns: /player\.pl|player\s?pl/i, merchantName: 'Player.pl', category: 'subscriptions', subCategory: 'streaming', confidence: 0.90 },
    { patterns: /canal\s?\+|canal\s?plus/i, merchantName: 'Canal+', category: 'subscriptions', subCategory: 'streaming', confidence: 0.90 },

    // ============ UTILITIES ============
    { patterns: /pge/i, merchantName: 'PGE', category: 'utilities', subCategory: 'electricity', confidence: 0.95 },
    { patterns: /enea/i, merchantName: 'Enea', category: 'utilities', subCategory: 'electricity', confidence: 0.95 },
    { patterns: /tauron/i, merchantName: 'Tauron', category: 'utilities', subCategory: 'electricity', confidence: 0.95 },
    { patterns: /energa/i, merchantName: 'Energa', category: 'utilities', subCategory: 'electricity', confidence: 0.95 },
    { patterns: /gazownia|psgaz|psp/i, merchantName: 'Gazownia', category: 'utilities', subCategory: 'gas', confidence: 0.90 },
    { patterns: /wodoci[aą]g|mpwik|aquanet/i, merchantName: 'Wodociągi', category: 'utilities', subCategory: 'water', confidence: 0.85 },
    { patterns: /orange/i, merchantName: 'Orange', category: 'utilities', subCategory: 'telecom', confidence: 0.90 },
    { patterns: /play\s|play$/i, merchantName: 'Play', category: 'utilities', subCategory: 'telecom', confidence: 0.85 },
    { patterns: /plus\s|plus$/i, merchantName: 'Plus', category: 'utilities', subCategory: 'telecom', confidence: 0.80 },
    { patterns: /t-?mobile/i, merchantName: 'T-Mobile', category: 'utilities', subCategory: 'telecom', confidence: 0.90 },
    { patterns: /upc|vectra/i, merchantName: 'UPC/Vectra', category: 'utilities', subCategory: 'internet', confidence: 0.90 },
    { patterns: /czynsz|administracj|wspólnota/i, merchantName: 'Czynsz', category: 'utilities', subCategory: 'rent', confidence: 0.80 },

    // ============ ENTERTAINMENT ============
    { patterns: /cinema\s?city/i, merchantName: 'Cinema City', category: 'entertainment', subCategory: 'cinema', confidence: 0.95 },
    { patterns: /multikino/i, merchantName: 'Multikino', category: 'entertainment', subCategory: 'cinema', confidence: 0.95 },
    { patterns: /helios/i, merchantName: 'Helios', category: 'entertainment', subCategory: 'cinema', confidence: 0.90 },
    { patterns: /kino\s/i, merchantName: 'Kino', category: 'entertainment', subCategory: 'cinema', confidence: 0.75 },
    { patterns: /ticketmaster|ebilet|eventim|bilety24/i, merchantName: 'Bilety', category: 'entertainment', subCategory: 'events', confidence: 0.85 },
    { patterns: /steam/i, merchantName: 'Steam', category: 'entertainment', subCategory: 'games', confidence: 0.95 },
    { patterns: /playstation|psn/i, merchantName: 'PlayStation', category: 'entertainment', subCategory: 'games', confidence: 0.90 },
    { patterns: /xbox/i, merchantName: 'Xbox', category: 'entertainment', subCategory: 'games', confidence: 0.90 },
    { patterns: /nintendo/i, merchantName: 'Nintendo', category: 'entertainment', subCategory: 'games', confidence: 0.90 },

    // ============ EDUCATION ============
    { patterns: /udemy/i, merchantName: 'Udemy', category: 'education', subCategory: 'courses', confidence: 0.95 },
    { patterns: /coursera/i, merchantName: 'Coursera', category: 'education', subCategory: 'courses', confidence: 0.95 },
    { patterns: /duolingo/i, merchantName: 'Duolingo', category: 'education', subCategory: 'courses', confidence: 0.95 },
    { patterns: /linkedin\s?learning/i, merchantName: 'LinkedIn Learning', category: 'education', subCategory: 'courses', confidence: 0.90 },
];

/**
 * Find merchant in database
 */
export function findMerchant(description: string): MerchantMapping | null {
    const normalizedDesc = description.toLowerCase().trim();

    for (const merchant of MERCHANT_DATABASE) {
        if (merchant.patterns.test(normalizedDesc)) {
            return merchant;
        }
    }

    return null;
}

/**
 * Get all merchants for a category
 */
export function getMerchantsByCategory(category: ExpenseCategory): MerchantMapping[] {
    return MERCHANT_DATABASE.filter(m => m.category === category);
}

/**
 * Get all unique sub-categories
 */
export function getSubCategories(): Record<ExpenseCategory, string[]> {
    const result: Record<string, Set<string>> = {};

    MERCHANT_DATABASE.forEach(m => {
        if (m.subCategory) {
            if (!result[m.category]) result[m.category] = new Set();
            result[m.category].add(m.subCategory);
        }
    });

    return Object.fromEntries(
        Object.entries(result).map(([k, v]) => [k, Array.from(v)])
    ) as Record<ExpenseCategory, string[]>;
}
