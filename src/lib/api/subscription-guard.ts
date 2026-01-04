/**
 * Server-side subscription validation for API routes
 * Ensures users can't bypass frontend gates to access premium features
 */

import { adminDb } from '@/lib/server/firebase-admin';

export type PlanType = 'free' | 'pro' | 'ultra';

interface SubscriptionCheckResult {
    isValid: boolean;
    plan: PlanType;
    error?: string;
}

/**
 * Check if a user has the required subscription plan
 * @param userId - The Firebase user ID
 * @param requiredPlan - Minimum required plan ('pro' or 'ultra')
 */
export async function checkSubscription(
    userId: string | undefined,
    requiredPlan: 'pro' | 'ultra' = 'pro'
): Promise<SubscriptionCheckResult> {
    // No userId provided
    if (!userId) {
        return {
            isValid: false,
            plan: 'free',
            error: 'User ID required'
        };
    }

    try {
        // Fetch user document from Firestore
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return {
                isValid: false,
                plan: 'free',
                error: 'User not found'
            };
        }

        const userData = userDoc.data();
        const plan = (userData?.subscription?.plan || 'free') as PlanType;

        // Check if user has required plan
        const planHierarchy: Record<PlanType, number> = {
            'free': 0,
            'pro': 1,
            'ultra': 2
        };

        const userPlanLevel = planHierarchy[plan];
        const requiredPlanLevel = planHierarchy[requiredPlan];

        if (userPlanLevel >= requiredPlanLevel) {
            return {
                isValid: true,
                plan
            };
        }

        return {
            isValid: false,
            plan,
            error: `Requires ${requiredPlan} plan, user has ${plan}`
        };

    } catch (error) {
        console.error('Subscription check error:', error);
        return {
            isValid: false,
            plan: 'free',
            error: 'Failed to verify subscription'
        };
    }
}

/**
 * Helper to return 403 response for unauthorized access
 */
export function unauthorizedResponse(message: string = 'Subscription required') {
    return new Response(
        JSON.stringify({
            error: message,
            code: 'SUBSCRIPTION_REQUIRED'
        }),
        {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
