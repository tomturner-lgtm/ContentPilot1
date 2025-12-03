import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // <--- Change ici aussi
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    // Gérer les événements Stripe
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const planType = session.metadata?.planType || 'pro'

      // Ici, vous devriez normalement :
      // 1. Sauvegarder dans une base de données
      // 2. Envoyer un email de confirmation
      // 3. Activer le plan utilisateur
      
      // Pour cette démo, on log juste
      console.log('Payment successful for plan:', planType)
      console.log('Customer email:', session.customer_email)
      console.log('Session ID:', session.id)

      // Note: Le statut sera géré côté client via localStorage
      // Dans une vraie app, utilisez une base de données
    }

    if (event.type === 'customer.subscription.deleted') {
      // Gérer l'annulation d'abonnement
      console.log('Subscription cancelled')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Webhook processing failed',
      },
      { status: 500 }
    )
  }
}

