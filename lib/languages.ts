export type LanguageCode =
  | 'fr'
  | 'en'
  | 'es'
  | 'de'
  | 'it'
  | 'pt'
  | 'nl'
  | 'pl'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  style: string
}

export const LANGUAGES: Record<LanguageCode, Language> = {
  fr: {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    style: 'Élégant, formel et structuré',
  },
  en: {
    code: 'en',
    name: 'Anglais',
    nativeName: 'English',
    flag: '🇬🇧',
    style: 'Clear, concise and engaging',
  },
  es: {
    code: 'es',
    name: 'Espagnol',
    nativeName: 'Español',
    flag: '🇪🇸',
    style: 'Dinámico, expresivo y claro',
  },
  de: {
    code: 'de',
    name: 'Allemand',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    style: 'Präzise, strukturiert und professionell',
  },
  it: {
    code: 'it',
    name: 'Italien',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    style: 'Elegante, coinvolgente e chiaro',
  },
  pt: {
    code: 'pt',
    name: 'Portugais',
    nativeName: 'Português',
    flag: '🇵🇹',
    style: 'Claro, envolvente e natural',
  },
  nl: {
    code: 'nl',
    name: 'Néerlandais',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    style: 'Direct, duidelijk en vriendelijk',
  },
  pl: {
    code: 'pl',
    name: 'Polonais',
    nativeName: 'Polski',
    flag: '🇵🇱',
    style: 'Profesjonalny, jasny i zwięzły',
  },
}

export const getLanguage = (code: LanguageCode): Language => {
  return LANGUAGES[code]
}

export const getDefaultLanguage = (): LanguageCode => {
  return 'fr'
}

// Obtenir le nom de la langue à partir du code
export const getLanguageName = (code: LanguageCode): string => {
  return LANGUAGES[code].name
}

// Obtenir le nom natif de la langue
export const getNativeLanguageName = (code: LanguageCode): string => {
  return LANGUAGES[code].nativeName
}
