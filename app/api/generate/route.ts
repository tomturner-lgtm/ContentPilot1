import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getTemplate, TemplateType, TEMPLATES } from '@/lib/templates'
import { LanguageCode, LANGUAGES, getLanguage } from '@/lib/languages'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { title, keyword, length, template, language } = await request.json()
    
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
      
      // Construire le prompt avec le template et la langue
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
      // Prompt par défaut (sans template) avec langue
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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const article = completion.choices[0]?.message?.content

    if (!article) {
      return NextResponse.json(
        { error: 'Impossible de générer l\'article' },
        { status: 500 }
      )
    }

    return NextResponse.json({ article })
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
