import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, username, applicationPassword, title, content, status } =
      await request.json()

    if (!siteUrl || !username || !applicationPassword || !title || !content) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Nettoyer l'URL
    const cleanUrl = siteUrl.trim().replace(/\/$/, '')

    // Endpoint WordPress REST API pour créer un post
    const publishUrl = `${cleanUrl}/wp-json/wp/v2/posts`

    // Créer l'Authorization header
    const credentials = Buffer.from(
      `${username}:${applicationPassword}`
    ).toString('base64')

    // Convertir le markdown en HTML si nécessaire (pour WordPress)
    // WordPress attend du HTML, donc on utilise le contenu tel quel
    // (Le markdown sera converti côté client si nécessaire)

    let retries = 3
    let lastError: Error | null = null

    while (retries > 0) {
      try {
        const response = await fetch(publishUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            status: status || 'draft', // 'draft' ou 'publish'
          }),
        })

        if (response.status === 401) {
          return NextResponse.json(
            {
              error:
                'Authentification échouée. Vérifiez vos identifiants WordPress.',
            },
            { status: 401 }
          )
        }

        if (response.status === 403) {
          return NextResponse.json(
            {
              error:
                'Droits insuffisants. L\'utilisateur n\'a pas les permissions pour publier des articles.',
            },
            { status: 403 }
          )
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message ||
              `Erreur HTTP ${response.status} lors de la publication`
          )
        }

        const postData = await response.json()

        return NextResponse.json({
          success: true,
          post: {
            id: postData.id,
            link: postData.link,
            editLink: postData.link?.replace('/?p=', '/wp-admin/post.php?action=edit&post='),
            status: postData.status,
          },
        })
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erreur inconnue')
        retries--

        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    return NextResponse.json(
      {
        error:
          lastError?.message || 'Erreur lors de la publication sur WordPress',
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Erreur publication WordPress:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors de la publication',
      },
      { status: 500 }
    )
  }
}
