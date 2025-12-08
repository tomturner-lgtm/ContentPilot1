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
        console.log('🔴 DEMANDE D\'ANNULATION D\'ABONNEMENT')
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

        console.log('📊 User actuel:')
        console.log('  - Plan:', user.plan)
        console.log('  - Subscription ID:', user.stripe_subscription_id)

        // 2. Vérifier/Récupérer l'ID d'abonnement
        let stripeSubscriptionId = user.stripe_subscription_id

        // Si ID manquant mais Customer ID présent, chercher chez Stripe
        if (!stripeSubscriptionId && user.stripe_customer_id) {
            console.log('⚠️ ID abonnement manquant, recherche via Customer ID...')
            const subscriptions = await stripe.subscriptions.list({
                customer: user.stripe_customer_id,
                status: 'active',
                limit: 1
            })

            if (subscriptions.data.length > 0) {
                stripeSubscriptionId = subscriptions.data[0].id
                console.log('✅ Abonnement retrouvé:', stripeSubscriptionId)

                // Mettre à jour la DB pour la prochaine fois
                await supabase.from('users').update({
                    stripe_subscription_id: stripeSubscriptionId
                }).eq('id', userId)
            }
        }

        if (!stripeSubscriptionId) {
            console.log('⚠️ Aucun abonnement trouvé chez Stripe')

            // Cas "Fantôme": Plan payant en DB mais pas d'abo Stripe -> On nettoie la DB
            if (user.plan && user.plan !== 'free') {
                console.log('🧹 Nettoyage des données d\'abonnement incohérentes')
                await supabase.from('users').update({
                    plan: 'free',
                    stripe_subscription_id: null,
                    stripe_subscription_status: 'canceled',
                    billing_period: null,
                    articles_limit: 0,
                    quota_reset_date: null
                }).eq('id', userId)

                return NextResponse.json({
                    success: true,
                    message: "Votre statut a été mis à jour (aucun abonnement actif détecté chez Stripe).",
                    accessUntil: new Date().toISOString(),
                })
            }

            return NextResponse.json(
                { error: 'Aucun abonnement actif à annuler' },
                { status: 400 }
            )
        }

        // 3. Récupérer l'abonnement Stripe
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

        console.log('📋 Abonnement Stripe:')
        console.log('  - Status:', subscription.status)
        console.log('  - Current period end:', new Date(subscription.current_period_end * 1000))

        // 4. Annuler l'abonnement À LA FIN DE LA PÉRIODE
        // L'utilisateur garde l'accès jusqu'à la date de fin
        const canceledSubscription = await stripe.subscriptions.update(
            stripeSubscriptionId,
            {
                cancel_at_period_end: true,
            }
        )

        console.log('✅ Abonnement programmé pour annulation')
        console.log('  - Accès jusqu\'au:', new Date(canceledSubscription.current_period_end * 1000))

        // 5. Mettre à jour la DB
        const { error: updateError } = await supabase
            .from('users')
            .update({
                stripe_subscription_status: 'canceling',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

        if (updateError) {
            console.error('❌ Erreur mise à jour DB:', updateError)
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour' },
                { status: 500 }
            )
        }

        console.log('✅ Annulation programmée avec succès')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        const accessUntilDate = new Date(canceledSubscription.current_period_end * 1000)

        return NextResponse.json({
            success: true,
            message: `Votre abonnement a été annulé. Vous conservez l'accès jusqu'au ${accessUntilDate.toLocaleDateString('fr-FR')}`,
            accessUntil: accessUntilDate.toISOString(),
        })

    } catch (error: any) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ ERREUR:', error.message)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json(
            { error: error.message || 'Erreur lors de l\'annulation' },
            { status: 500 }
        )
    }
}
