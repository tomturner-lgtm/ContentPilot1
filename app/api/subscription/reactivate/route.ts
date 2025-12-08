import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
})

const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: Request) {
    try {
        const { userId } = await req.json()
        const supabase = getSupabaseAdmin()

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🟢 DEMANDE DE RÉACTIVATION D\'ABONNEMENT')
        console.log('User ID:', userId)

        // 1. Récupérer l'utilisateur
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            console.error('❌ Utilisateur non trouvé')
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            )
        }

        // 2. Vérifier qu'il a un abonnement à réactiver
        if (!user.stripe_subscription_id) {
            console.log('⚠️ Aucun abonnement à réactiver')
            return NextResponse.json(
                { error: 'Aucun abonnement à réactiver' },
                { status: 400 }
            )
        }

        // 3. Réactiver l'abonnement (annuler la programmation d'annulation)
        const reactivatedSubscription = await stripe.subscriptions.update(
            user.stripe_subscription_id,
            {
                cancel_at_period_end: false,
            }
        )

        console.log('✅ Abonnement réactivé')
        console.log('  - Status:', reactivatedSubscription.status)

        // 4. Mettre à jour la DB
        const { error: updateError } = await supabase
            .from('users')
            .update({
                stripe_subscription_status: 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        if (updateError) {
            console.error('❌ Erreur mise à jour DB:', updateError)
        }

        console.log('✅ Réactivation réussie')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json({
            success: true,
            message: 'Votre abonnement a été réactivé avec succès !',
        })

    } catch (error: any) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ ERREUR:', error.message)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json(
            { error: error.message || 'Erreur lors de la réactivation' },
            { status: 500 }
        )
    }
}
