import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY is missing. Stripe functionality will fail at runtime.');
}

export const stripe = new Stripe(apiKey, {
    apiVersion: '2025-12-15.clover' as any,
    typescript: true,
});
