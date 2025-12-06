import { NextResponse } from 'next/server'

// Cette API retourne les price IDs Stripe (côté serveur, donc accès aux variables sans NEXT_PUBLIC_)
export async function GET() {
    return NextResponse.json({
        test: process.env.STRIPE_PRICE_TEST || null,
        proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || null,
        proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || null,
        unlimitedMonthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || null,
        unlimitedYearly: process.env.STRIPE_PRICE_UNLIMITED_YEARLY || null,
    })
}
