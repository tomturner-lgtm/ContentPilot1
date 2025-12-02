'use client'

import { useState, useEffect, useRef } from 'react'
import { LanguageCode, LANGUAGES, getLanguage } from '@/lib/languages'

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode
  onSelectLanguage: (language: LanguageCode) => void
}

const LANGUAGE_STORAGE_KEY = 'contentflow_last_language'

export default function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const languages = Object.values(LANGUAGES)

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (languageCode: LanguageCode) => {
    onSelectLanguage(languageCode)
    setIsOpen(false)
    // Sauvegarder la langue dans localStorage
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error)
    }
  }

  const selectedLang = getLanguage(selectedLanguage)

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Langue de l'article
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left shadow-sm hover:border-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedLang.flag}</span>
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedLang.name}
            </div>
            <div className="text-xs text-gray-500">
              {selectedLang.nativeName}
            </div>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg bg-white border border-gray-200 shadow-lg max-h-96 overflow-auto">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleSelect(language.code)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  selectedLanguage === language.code
                    ? 'bg-primary-50 border-l-4 border-primary-600'
                    : ''
                }`}
              >
                <span className="text-2xl">{language.flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {language.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {language.nativeName}
                  </div>
                  {selectedLanguage === language.code && (
                    <div className="text-xs text-primary-600 mt-1">
                      Style : {language.style}
                    </div>
                  )}
                </div>
                {selectedLanguage === language.code && (
                  <svg
                    className="h-5 w-5 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
            <div className="border-t border-gray-200 mt-1 pt-1">
              <div className="px-4 py-3 text-xs text-gray-500 text-center">
                Plus de langues bientôt...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview de la langue sélectionnée */}
      {selectedLanguage && (
        <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-2">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <span className="text-lg">{selectedLang.flag}</span>
            <span>
              Articles générés en <strong>{selectedLang.nativeName}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook pour charger la dernière langue utilisée
export const useLastLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return 'fr'
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && stored in LANGUAGES) {
      return stored as LanguageCode
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la langue:', error)
  }
  
  return 'fr'
}
