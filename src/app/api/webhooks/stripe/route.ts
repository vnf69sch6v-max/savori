import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/server/firebase-admin';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Disable Data Body Parser for Webhooks
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Handle the event
    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;
            const planId = session.metadata?.planId as 'pro' | 'ultimate' || 'pro';

            if (userId) {
                console.log(`Processing successful checkout for ${userId} - Plan: ${planId}`);

                await adminDb.collection('users').doc(userId).set({
                    subscription: {
                        plan: planId,
                        status: 'active',
                        periodEnd: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000), // Provisional 30 days
                        stripeCustomerId: session.customer as string,
                        updatedAt: admin.firestore.Timestamp.now()
                    }
                }, { merge: true });
            }
        }

        // Handle subscription updates (renewals, cancellations)
        if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = subscription.metadata?.userId; // Ensure we pass this or look it up

            // If userId is not in metadata, we might need to look it up by customerId
            let targetUserId = userId;
            if (!targetUserId) {
                const usersSnap = await adminDb.collection('users')
                    .where('subscription.stripeCustomerId', '==', subscription.customer)
                    .limit(1)
                    .get();
                if (!usersSnap.empty) {
                    targetUserId = usersSnap.docs[0].id;
                }
            }

            if (targetUserId) {
                const status = subscription.status === 'active' ? 'active' : 'canceled';
                // Determine plan based on product ID (simplified logic here)
                // Real app should map Stripe Price ID -> Plan Name

                await adminDb.collection('users').doc(targetUserId).set({
                    subscription: {
                        status,
                        periodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
                        updatedAt: admin.firestore.Timestamp.now()
                    }
                }, { merge: true });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler failed:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
