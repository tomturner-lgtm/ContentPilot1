import { NextResponse } from 'next/server'

// Cette API retourne les price IDs Stripe (côté serveur, donc accès aux variables sans NEXT_PUBLIC_)
export async function GET() {
    return NextResponse.json({
        test: process.env.STRIPE_PRICE_TEST || 'price_1SVW9TCQc7L9vhgD6NrtRBK4',
        proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1SVGLwCQc7L9vhgDOp2cw4wn',
        proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_1SVUXJCQc7L9vhgDVShAMmE4',
        unlimitedMonthly: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || 'price_1SVGMbCQc7L9vhgDuc2zUVyS',
        unlimitedYearly: process.env.STRIPE_PRICE_UNLIMITED_YEARLY || 'price_1SVUXXCQc7L9vhgDEkMjivDk',
    })
}
