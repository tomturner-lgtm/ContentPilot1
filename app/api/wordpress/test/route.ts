import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { siteUrl, username, applicationPassword } = await request.json()

    if (!siteUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { error: 'Configuration WordPress incomplète' },
        { status: 400 }
      )
    }

    // Nettoyer l'URL (enlever le slash final si présent)
    const cleanUrl = siteUrl.trim().replace(/\/$/, '')

    // Tester la connexion avec l'endpoint /wp-json/wp/v2/users/me
    const testUrl = `${cleanUrl}/wp-json/wp/v2/users/me`

    // Créer l'Authorization header avec Basic Auth
    const credentials = Buffer.from(
      `${username}:${applicationPassword}`
    ).toString('base64')

    let retries = 3
    let lastError: Error | null = null

    while (retries > 0) {
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 401) {
          return NextResponse.json(
            {
              error:
                'Authentification échouée. Vérifiez votre nom d\'utilisateur et votre Application Password.',
            },
            { status: 401 }
          )
        }

        if (response.status === 403) {
          return NextResponse.json(
            {
              error:
                'Droits insuffisants. Assurez-vous que l\'utilisateur a les permissions d\'écriture.',
            },
            { status: 403 }
          )
        }

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `Erreur HTTP ${response.status}: ${errorText.substring(0, 100)}`
          )
        }

        const userData = await response.json()

        return NextResponse.json({
          success: true,
          user: {
            name: userData.name,
            email: userData.email,
          },
        })
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erreur inconnue')
        retries--

        if (retries > 0) {
          // Attendre avant de réessayer
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    // Si toutes les tentatives ont échoué
    if (lastError?.message.includes('fetch')) {
      return NextResponse.json(
        {
          error:
            'Impossible de se connecter au site WordPress. Vérifiez que l\'URL est correcte et que le site est accessible.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: lastError?.message || 'Erreur de connexion au site WordPress',
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Erreur test WordPress:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Une erreur est survenue lors du test',
      },
      { status: 500 }
    )
  }
}
