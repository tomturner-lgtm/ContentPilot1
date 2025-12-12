import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import OpenAI from 'openai'
import { getTemplate, TemplateType, TEMPLATES } from '@/lib/templates'
import { LanguageCode, LANGUAGES, getLanguage } from '@/lib/languages'

export const dynamic = 'force-dynamic'

// Lazy instantiation pour éviter les erreurs de build
const getOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { title, keyword, length, template, language } = await request.json()

    // Vérifier et utiliser le quota
    const { data: quotaResult, error: quotaError } = await supabase.rpc('check_and_use_quota', {
      p_user_id: session.user.id
    })

    if (quotaError) {
      console.error('Erreur quota:', quotaError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du quota' },
        { status: 500 }
      )
    }

    if (!quotaResult.success) {
      return NextResponse.json(
        { error: quotaResult.message || 'Quota épuisé' },
        { status: 403 }
      )
    }

    // Langue par défaut : français
    const articleLanguage: LanguageCode = (language && language in LANGUAGES)
      ? (language as LanguageCode)
      : 'fr'

    const langData = getLanguage(articleLanguage)

    if (!title || !keyword) {
      return NextResponse.json(
        { error: 'Le titre et le mot-clé sont requis' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'La clé API OpenAI n\'est pas configurée' },
        { status: 500 }
      )
    }

    // Utiliser le template si fourni, sinon prompt par défaut
    let prompt: string
    let systemMessage: string

    if (template && template in TEMPLATES) {
      const templateData = getTemplate(template as TemplateType)

      prompt = `Tu es un expert en rédaction d'articles de blog SEO spécialisé dans le format "${templateData.name}".

Génère un article de blog professionnel et bien structuré avec les spécifications suivantes :

- Titre principal : "${title}"
- Mot-clé principal à optimiser : "${keyword}"
- Longueur cible : ${length} mots
- Langue : Écris en ${langData.nativeName} (${langData.code})
- Style : ${langData.style}
- Ton : ${templateData.tone}
- Format : Markdown avec titres (##), listes, paragraphes

${templateData.prompt}

- Optimisation SEO : utiliser le mot-clé "${keyword}" naturellement dans les titres et le contenu
- Le contenu doit être structuré selon le template "${templateData.name}" avec la structure : ${templateData.structure}
- IMPORTANT : Tout l'article doit être écrit en ${langData.nativeName}, y compris les titres, sous-titres et le contenu

Article :`
      systemMessage = `Tu es un rédacteur professionnel spécialisé dans la création d'articles de blog optimisés SEO au format "${templateData.name}" en ${langData.nativeName}. Tu génères du contenu structuré en Markdown avec un ton ${templateData.tone} et un style ${langData.style}.`
    } else {
      prompt = `Tu es un expert en rédaction d'articles de blog SEO. 

Génère un article de blog professionnel et bien structuré avec les spécifications suivantes :

- Titre principal : "${title}"
- Mot-clé principal à optimiser : "${keyword}"
- Longueur cible : ${length} mots
- Langue : Écris en ${langData.nativeName} (${langData.code})
- Style : ${langData.style}
- Structure : 
  * Introduction accrocheuse (100-150 mots)
  * Au moins 3 sections avec sous-titres (H2)
  * Conclusion avec appel à l'action (100-150 mots)
- Format : Markdown avec titres (##), listes, paragraphes
- Optimisation SEO : utiliser le mot-clé naturellement dans les titres et le contenu
- IMPORTANT : Tout l'article doit être écrit en ${langData.nativeName}, y compris les titres, sous-titres et le contenu

Article :`
      systemMessage = `Tu es un rédacteur professionnel spécialisé dans la création d'articles de blog optimisés SEO en ${langData.nativeName}. Tu génères du contenu structuré en Markdown avec un style ${langData.style}.`
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const articleContent = completion.choices[0]?.message?.content

    if (!articleContent) {
      return NextResponse.json(
        { error: 'Impossible de générer l\'article' },
        { status: 500 }
      )
    }

    // Récupérer l'ID interne de l'utilisateur (users.id, pas auth_id)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single()

    if (userError || !userData) {
      console.error('Erreur récupération user:', userError)
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Sauvegarder l'article dans la base de données avec le bon user_id
    const { error: saveError } = await supabase
      .from('articles')
      .insert({
        user_id: userData.id,  // Utiliser l'ID interne, pas l'auth_id
        title,
        content: articleContent,
        keyword,
        language: articleLanguage,
        template: template || null,
        word_count: length, // Estimation basée sur la demande
      })

    if (saveError) {
      console.error('Erreur sauvegarde article:', saveError)
      // On ne retourne pas d'erreur ici car l'article a été généré
    }

    return NextResponse.json({ article: articleContent })
  } catch (error) {
    console.error('Erreur OpenAI:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la génération',
      },
      { status: 500 }
    )
  }
}
