/**
 * Behavioral Categories Service
 * Kakeibo 2.0 - Psychological spending categorization
 * Based on: Behawioralna Architektura Wydatków research
 */

import { BehavioralCategory, EmotionTag, ExpenseCategory } from '@/types';

// ============ CATEGORY METADATA ============

export interface BehavioralCategoryMeta {
    id: BehavioralCategory;
    emoji: string;
    name: string;
    shortDesc: string;         // Co zawiera (krótko)
    examples: string;          // Przykładowe wydatki
    psychBenefit: string;      // Korzyść psychologiczna
    group: 'fortress' | 'life';
    subgroup: 'survival' | 'dopamine' | 'social' | 'chaos';
    gradient: [string, string];
    psychTrigger: string;
}

export const BEHAVIORAL_CATEGORIES: Record<BehavioralCategory, BehavioralCategoryMeta> = {
    // ====== 🏰 TWIERDZA (Kotwica) - Koszty nienegocjowalne ======
    fortress: {
        id: 'fortress',
        emoji: '🏰',
        name: 'Twierdza',
        shortDesc: 'Czynsz, hipoteka, rachunki stałe',
        examples: 'Czynsz • Hipoteka • Prąd • Gaz • Woda',
        psychBenefit: 'Fundament bezpieczeństwa - "Cztery Ściany"',
        group: 'fortress',
        subgroup: 'survival',
        gradient: ['slate-700', 'slate-900'],
        psychTrigger: 'Stabilność i schronienie',
    },
    shield: {
        id: 'shield',
        emoji: '🛡️',
        name: 'Spokojny Sen',
        shortDesc: 'Fundusz awaryjny, ubezpieczenia',
        examples: 'Ubezpieczenie • Fundusz nagły • Spłata długu',
        psychBenefit: 'Redukcja lęku - "Święty Spokój"',
        group: 'fortress',
        subgroup: 'survival',
        gradient: ['blue-600', 'blue-900'],
        psychTrigger: 'Sprzedajesz sobie spokój, nie tylko rezerwę',
    },
    fuel: {
        id: 'fuel',
        emoji: '🥗',
        name: 'Paliwo Życia',
        shortDesc: 'Żywność podstawowa, transport codzienny',
        examples: 'Biedronka • Lidl • Bilet miesięczny • Benzyna',
        psychBenefit: 'Konieczność, nie wybór - oddziel od restauracji!',
        group: 'fortress',
        subgroup: 'survival',
        gradient: ['emerald-600', 'emerald-900'],
        psychTrigger: 'To jest twoje paliwo, nie rozrywka',
    },

    // ====== 🎢 ŻYCIE - Dopamina i Radość ======
    dopamine: {
        id: 'dopamine',
        emoji: '🎢',
        name: 'Strzały Dopaminy',
        shortDesc: 'Gadżety, hobby, gry, zakupy dla przyjemności',
        examples: 'Allegro • Amazon • Steam • Zestawy LEGO',
        psychBenefit: 'Kontrolowana strefa przyjemności bez winy',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['purple-500', 'pink-600'],
        psychTrigger: 'Oczekiwanie na zakup > posiadanie rzeczy',
    },
    micro_joy: {
        id: 'micro_joy',
        emoji: '☕',
        name: 'Mikro-Radość',
        shortDesc: 'Kawa, przekąski, drobne luksusy',
        examples: 'Starbucks • Żabka • Rossmann • Sephora',
        psychBenefit: '"Efekt szminki" - małe przyjemności są OK',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['amber-500', 'orange-600'],
        psychTrigger: 'Mikro-momenty błogości regulują nastrój',
    },
    xp_points: {
        id: 'xp_points',
        emoji: '🎟️',
        name: 'Punkty Doświadczenia',
        shortDesc: 'Podróże, koncerty, kultura - "levelowanie życia"',
        examples: 'Bilety • Festiwale • Podróże • Muzea',
        psychBenefit: 'Grywalizacja życia - zbierasz wspomnienia',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['cyan-500', 'blue-600'],
        psychTrigger: 'Wydajesz na BYCIE, nie POSIADANIE',
    },
    for_me: {
        id: 'for_me',
        emoji: '🧘',
        name: 'Dla Mnie',
        shortDesc: 'Self-care, rozwój osobisty, zdrowie psychiczne',
        examples: 'Siłownia • Terapia • Spa • Kursy • Książki',
        psychBenefit: 'Inwestycja w siebie buduje wartość',
        group: 'life',
        subgroup: 'dopamine',
        gradient: ['teal-500', 'emerald-600'],
        psychTrigger: 'To nie wydatek - to upgrade Ciebie',
    },

    // ====== 🍷 ŻYCIE - Więzi Społeczne ======
    social_glue: {
        id: 'social_glue',
        emoji: '🍷',
        name: 'Smar Społeczny',
        shortDesc: 'Wyjścia z ludźmi - cel to WIĘŹ, nie jedzenie',
        examples: 'Restauracje • Bary • Kawa ze znajomymi',
        psychBenefit: 'Walidacja potrzeb społecznych',
        group: 'life',
        subgroup: 'social',
        gradient: ['rose-500', 'pink-600'],
        psychTrigger: 'Wydajesz na relacje, nie na kalorie',
    },
    love_language: {
        id: 'love_language',
        emoji: '🎁',
        name: 'Język Miłości',
        shortDesc: 'Prezenty, darowizny, wyrażanie uczuć',
        examples: 'Prezenty • Kwiaty • Datki charytatywne',
        psychBenefit: 'Akt uczucia lub charytatywności',
        group: 'life',
        subgroup: 'social',
        gradient: ['red-500', 'rose-600'],
        psychTrigger: 'Dawanie = szczęście (udowodnione naukowo)',
    },
    tribe_tax: {
        id: 'tribe_tax',
        emoji: '👥',
        name: 'Podatek Plemienny',
        shortDesc: 'Zobowiązania społeczne, których nie unikniesz',
        examples: 'Wesela • Składki • Imprezy firmowe • Rounds',
        psychBenefit: 'Uznaje koszt presji społecznej',
        group: 'life',
        subgroup: 'social',
        gradient: ['indigo-500', 'purple-600'],
        psychTrigger: 'Czasem płacisz za przynależność',
    },

    // ====== 🧠 ŻYCIE - Stack Neuroatypowy/Chaos ======
    chaos_tax: {
        id: 'chaos_tax',
        emoji: '🧠',
        name: 'Podatek od Chaosu',
        shortDesc: 'Koszty ADHD, zapominalstwa, wyczerpania',
        examples: 'Opłaty za zwłokę • Zgubione rzeczy • Duplikaty',
        psychBenefit: 'ADHD-friendly - bez osądzania, tylko tracking',
        group: 'life',
        subgroup: 'chaos',
        gradient: ['gray-500', 'gray-700'],
        psychTrigger: 'Widzisz realny koszt chaosu → możesz go zmniejszyć',
    },
    impulse_zone: {
        id: 'impulse_zone',
        emoji: '⚡',
        name: 'Strefa Bez Winy',
        shortDesc: 'Wyznaczona kwota na impulsy - zero wstydu',
        examples: 'Cokolwiek! (w ramach limitu)',
        psychBenefit: '"Bezpieczna" kwota do przepuszczenia',
        group: 'life',
        subgroup: 'chaos',
        gradient: ['yellow-500', 'amber-600'],
        psychTrigger: 'Planowana spontaniczność = brak wyrzutów sumienia',
    },
};

// ============ GROUP DESCRIPTIONS ============

export const GROUP_DESCRIPTIONS = {
    fortress: {
        name: 'Twierdza',
        emoji: '🏰',
        headline: 'Koszty nienegocjowalne',
        description: 'Elementy, na które nie masz wpływu w krótkim terminie. Celem jest automatyzacja - nie chcesz o nich myśleć.',
    },
    life: {
        name: 'Życie',
        emoji: '🌈',
        headline: 'Twoje wybory',
        description: 'Tu decydujesz TY. Celem jest uważność i zgodność z wartościami - czy ten wydatek jest zgodny z tym, kim chcesz być?',
    },
};

// ============ EMOTION METADATA ============

export interface EmotionMeta {
    id: EmotionTag;
    emoji: string;
    name: string;
    color: string;
    description: string;
}

export const EMOTIONS: Record<EmotionTag, EmotionMeta> = {
    joy: {
        id: 'joy',
        emoji: '😊',
        name: 'Radość',
        color: 'emerald',
        description: 'Świadomy zakup, który cieszy'
    },
    necessity: {
        id: 'necessity',
        emoji: '😐',
        name: 'Konieczność',
        color: 'slate',
        description: 'Musiałem - nie miałem wyboru'
    },
    tired: {
        id: 'tired',
        emoji: '😴',
        name: 'Zmęczenie',
        color: 'blue',
        description: 'Zapłaciłem za wygodę bo nie miałem siły'
    },
    regret: {
        id: 'regret',
        emoji: '😢',
        name: 'Żal',
        color: 'red',
        description: 'Wolałbym tego nie kupić'
    },
    bored: {
        id: 'bored',
        emoji: '😑',
        name: 'Nuda',
        color: 'gray',
        description: 'Kupiłem bo było nudno'
    },
    social: {
        id: 'social',
        emoji: '🤝',
        name: 'Więzi',
        color: 'amber',
        description: 'Wydatek budujący relacje'
    },
    reward: {
        id: 'reward',
        emoji: '🎁',
        name: 'Nagroda',
        color: 'purple',
        description: 'Zasłużyłem na to!'
    },
};

// ============ MCC → BEHAVIORAL MAPPING ============

export const MCC_TO_BEHAVIORAL: Record<ExpenseCategory, BehavioralCategory> = {
    groceries: 'fuel',
    restaurants: 'social_glue',
    transport: 'fuel',
    utilities: 'fortress',
    entertainment: 'dopamine',
    shopping: 'impulse_zone',
    health: 'for_me',
    education: 'xp_points',
    subscriptions: 'micro_joy',
    other: 'impulse_zone',
};

// ============ HELPERS ============

export function getCategoryMeta(category: BehavioralCategory): BehavioralCategoryMeta {
    return BEHAVIORAL_CATEGORIES[category];
}

export function getEmotionMeta(emotion: EmotionTag): EmotionMeta {
    return EMOTIONS[emotion];
}

export function getFortressCategories(): BehavioralCategoryMeta[] {
    return Object.values(BEHAVIORAL_CATEGORIES).filter(c => c.group === 'fortress');
}

export function getLifeCategories(): BehavioralCategoryMeta[] {
    return Object.values(BEHAVIORAL_CATEGORIES).filter(c => c.group === 'life');
}

export function suggestBehavioralCategory(mccCategory: ExpenseCategory): BehavioralCategory {
    return MCC_TO_BEHAVIORAL[mccCategory] || 'impulse_zone';
}
