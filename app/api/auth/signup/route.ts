import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    try {
        const { email, password, firstName } = await request.json()

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email et mot de passe requis' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Le mot de passe doit contenir au moins 6 caractères' },
                { status: 400 }
            )
        }

        // Créer l'utilisateur avec l'admin client
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Confirme l'email automatiquement (pas de vérification par email)
            user_metadata: {
                first_name: firstName || '',
            },
        })

        if (authError) {
            console.error('Auth error:', authError)

            // Erreurs spécifiques
            if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
                return NextResponse.json(
                    { error: 'Cet email est déjà utilisé' },
                    { status: 400 }
                )
            }

            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: 'Erreur lors de la création du compte' },
                { status: 500 }
            )
        }

        // Créer le profil dans la table profiles
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: authData.user.id,
                email: email,
                first_name: firstName || null,
            })

        if (profileError) {
            console.error('Profile error:', profileError)
            // On continue même si le profil échoue - le trigger peut le créer
        }

        // Créer le quota utilisateur (0 articles - plan free)
        const { error: quotaError } = await supabaseAdmin
            .from('user_quotas')
            .upsert({
                user_id: authData.user.id,
                plan_type: 'free',
                articles_limit: 0,
                articles_used: 0,
            })

        if (quotaError) {
            console.error('Quota error:', quotaError)
            // On continue même si le quota échoue
        }

        return NextResponse.json({
            success: true,
            message: 'Compte créé avec succès',
            user: {
                id: authData.user.id,
                email: authData.user.email,
            },
        })

    } catch (error: any) {
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: error.message || 'Erreur serveur' },
            { status: 500 }
        )
    }
}
