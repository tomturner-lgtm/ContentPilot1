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

        // Note: Le trigger on_auth_user_created crée automatiquement l'entrée dans la table users
        // avec plan='free' et articles_limit=1

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
