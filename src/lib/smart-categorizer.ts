/**
 * Savori Smart Categorizer
 * Inteligentna kategoryzacja z uczeniem się od użytkownika
 */

import { ExpenseCategory } from '@/types';
import { findMerchant } from './merchant-db';
import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    Timestamp,
    increment
} from 'firebase/firestore';

// ============ TYPES ============

export interface CategoryResult {
    category: ExpenseCategory;
    subCategory?: string;
    confidence: number;
    source: 'user_rule' | 'merchant_db' | 'ai' | 'keyword';
    merchantName?: string;
}

export interface UserCategoryRule {
    id: string;
    userId: string;
    type: 'merchant' | 'keyword' | 'amount_range';
    pattern?: string;
    minAmount?: number;
    maxAmount?: number;
    category: ExpenseCategory;
    subCategory?: string;
    createdFrom: 'correction' | 'manual' | 'ai_suggested';
    usageCount: number;
    lastUsed: Timestamp;
    createdAt: Timestamp;
}

export interface CategoryFeedback {
    id: string;
    userId: string;
    expenseId: string;
    merchantName: string;
    originalCategory: ExpenseCategory;
    correctedCategory: ExpenseCategory;
    keywords: string[];
    amount: number;
    createdAt: Timestamp;
}

// ============ SMART CATEGORIZER ============

export class SmartCategorizer {
    private userRulesCache: Map<string, UserCategoryRule[]> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Main categorization function with priority:
     * 1. User Rules (100% trust)
     * 2. Merchant DB (if confidence > 0.8)
     * 3. Keyword matching
     * 4. Fallback to 'other'
     */
    async categorize(
        userId: string,
        description: string,
        amount?: number
    ): Promise<CategoryResult> {
        const normalizedDesc = description.toLowerCase().trim();

        // 1. Check user-specific rules first
        const userRule = await this.findUserRule(userId, normalizedDesc, amount);
        if (userRule) {
            // Update usage count
            await this.incrementRuleUsage(userId, userRule.id);
            return {
                category: userRule.category,
                subCategory: userRule.subCategory,
                confidence: 1.0,
                source: 'user_rule',
            };
        }

        // 2. Check merchant database
        const merchant = findMerchant(description);
        if (merchant && merchant.confidence >= 0.8) {
            return {
                category: merchant.category,
                subCategory: merchant.subCategory,
                confidence: merchant.confidence,
                source: 'merchant_db',
                merchantName: merchant.merchantName,
            };
        }

        // 3. Keyword-based categorization
        const keywordResult = this.categorizeByKeywords(normalizedDesc);
        if (keywordResult.confidence > 0.6) {
            return keywordResult;
        }

        // 4. If merchant found but low confidence, still use it
        if (merchant) {
            return {
                category: merchant.category,
                subCategory: merchant.subCategory,
                confidence: merchant.confidence,
                source: 'merchant_db',
                merchantName: merchant.merchantName,
            };
        }

        // 5. Fallback
        return {
            category: 'other',
            confidence: 0.3,
            source: 'keyword',
        };
    }

    /**
     * Find user-specific rule
     */
    private async findUserRule(
        userId: string,
        description: string,
        amount?: number
    ): Promise<UserCategoryRule | null> {
        const rules = await this.getUserRules(userId);

        for (const rule of rules) {
            if (rule.type === 'merchant' && rule.pattern) {
                const regex = new RegExp(rule.pattern, 'i');
                if (regex.test(description)) {
                    return rule;
                }
            }

            if (rule.type === 'keyword' && rule.pattern) {
                if (description.includes(rule.pattern.toLowerCase())) {
                    return rule;
                }
            }

            if (rule.type === 'amount_range' && amount !== undefined) {
                const min = rule.minAmount ?? 0;
                const max = rule.maxAmount ?? Infinity;
                if (amount >= min && amount <= max) {
                    return rule;
                }
            }
        }

        return null;
    }

    /**
     * Get user rules with caching
     */
    private async getUserRules(userId: string): Promise<UserCategoryRule[]> {
        const now = Date.now();
        const expiry = this.cacheExpiry.get(userId);

        if (expiry && expiry > now && this.userRulesCache.has(userId)) {
            return this.userRulesCache.get(userId)!;
        }

        // Fetch from Firestore
        const rulesRef = collection(db, 'users', userId, 'categoryRules');
        const q = query(rulesRef, orderBy('usageCount', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        const rules = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as UserCategoryRule[];

        this.userRulesCache.set(userId, rules);
        this.cacheExpiry.set(userId, now + this.CACHE_TTL);

        return rules;
    }

    /**
     * Increment rule usage count
     */
    private async incrementRuleUsage(userId: string, ruleId: string): Promise<void> {
        try {
            const ruleRef = doc(db, 'users', userId, 'categoryRules', ruleId);
            await updateDoc(ruleRef, {
                usageCount: increment(1),
                lastUsed: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error incrementing rule usage:', error);
        }
    }

    /**
     * Keyword-based categorization
     */
    private categorizeByKeywords(description: string): CategoryResult {
        const keywords: Record<ExpenseCategory, string[]> = {
            groceries: ['sklep', 'spożywcz', 'warzywa', 'owoce', 'mięso', 'pieczywo', 'nabiał', 'market'],
            restaurants: ['restauracja', 'bar', 'pizza', 'sushi', 'kebab', 'obiad', 'lunch', 'kolacja', 'kawiarnia', 'cafe'],
            transport: ['paliwo', 'benzyna', 'diesel', 'autobus', 'tramwaj', 'metro', 'przejazd', 'parking', 'autostrada', 'mycie'],
            utilities: ['prąd', 'gaz', 'woda', 'internet', 'telefon', 'abonament', 'opłata', 'rachunek'],
            entertainment: ['kino', 'teatr', 'koncert', 'gra', 'rozrywka', 'bilety', 'wstęp'],
            shopping: ['zakup', 'ubrania', 'buty', 'elektronika', 'meble', 'wyposażenie'],
            health: ['leki', 'apteka', 'lekarz', 'wizyta', 'badanie', 'ubezpieczenie zdrowotne'],
            education: ['kurs', 'szkolenie', 'książka', 'nauka', 'studia', 'czesne'],
            subscriptions: ['subskrypcja', 'premium', 'miesięczny', 'roczny'],
            other: [],
        };

        let bestMatch: { category: ExpenseCategory; score: number } = { category: 'other', score: 0 };

        for (const [category, words] of Object.entries(keywords)) {
            for (const word of words) {
                if (description.includes(word)) {
                    const score = word.length / description.length;
                    if (score > bestMatch.score) {
                        bestMatch = { category: category as ExpenseCategory, score };
                    }
                }
            }
        }

        return {
            category: bestMatch.category,
            confidence: Math.min(0.8, bestMatch.score * 5 + 0.4),
            source: 'keyword',
        };
    }

    /**
     * Learn from user correction
     */
    async learnFromCorrection(
        userId: string,
        expenseId: string,
        merchantName: string,
        originalCategory: ExpenseCategory,
        correctedCategory: ExpenseCategory,
        amount: number
    ): Promise<void> {
        // 1. Save feedback
        const feedbackRef = collection(db, 'users', userId, 'categoryFeedback');
        await addDoc(feedbackRef, {
            userId,
            expenseId,
            merchantName,
            originalCategory,
            correctedCategory,
            keywords: this.extractKeywords(merchantName),
            amount,
            createdAt: Timestamp.now(),
        });

        // 2. Check if we should create a rule (3+ similar corrections)
        const pattern = this.extractPattern(merchantName);
        const similarCount = await this.countSimilarFeedback(userId, pattern, correctedCategory);

        if (similarCount >= 3) {
            await this.createUserRule(userId, pattern, correctedCategory, 'correction');
        }

        // 3. Invalidate cache
        this.userRulesCache.delete(userId);
        this.cacheExpiry.delete(userId);
    }

    /**
     * Count similar feedback
     */
    private async countSimilarFeedback(
        userId: string,
        pattern: string,
        category: ExpenseCategory
    ): Promise<number> {
        const feedbackRef = collection(db, 'users', userId, 'categoryFeedback');
        const snapshot = await getDocs(feedbackRef);

        let count = 0;
        const regex = new RegExp(pattern, 'i');

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.correctedCategory === category && regex.test(data.merchantName)) {
                count++;
            }
        });

        return count;
    }

    /**
     * Create user rule
     */
    async createUserRule(
        userId: string,
        pattern: string,
        category: ExpenseCategory,
        source: 'correction' | 'manual' | 'ai_suggested',
        subCategory?: string
    ): Promise<string> {
        const rulesRef = collection(db, 'users', userId, 'categoryRules');

        const rule: Omit<UserCategoryRule, 'id'> = {
            userId,
            type: 'merchant',
            pattern,
            category,
            subCategory,
            createdFrom: source,
            usageCount: 0,
            lastUsed: Timestamp.now(),
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(rulesRef, rule);

        // Invalidate cache
        this.userRulesCache.delete(userId);
        this.cacheExpiry.delete(userId);

        return docRef.id;
    }

    /**
     * Extract pattern from merchant name
     */
    private extractPattern(merchantName: string): string {
        return merchantName
            .toLowerCase()
            .replace(/[0-9]/g, '')
            .replace(/\s+/g, '\\s*')
            .replace(/[^\w\s\\*]/g, '')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .join('\\s*');
    }

    /**
     * Extract keywords from description
     */
    private extractKeywords(description: string): string[] {
        return description
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 5);
    }

    /**
     * Clear cache for user
     */
    clearCache(userId: string): void {
        this.userRulesCache.delete(userId);
        this.cacheExpiry.delete(userId);
    }
}

// Singleton instance
export const smartCategorizer = new SmartCategorizer();
