'use client'

import { clearUserCache } from '@/lib/auth-utils'

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      // Nettoyer le cache utilisateur avant déconnexion
      clearUserCache()
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (response.ok) {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error logging out:', error)
      // Même en cas d'erreur, nettoyer et rediriger
      clearUserCache()
      window.location.href = '/login'
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-6 py-3 text-base font-semibold text-red-600 shadow-sm hover:bg-red-50 transition-all duration-200"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
        />
      </svg>
      Se déconnecter
    </button>
  )
}

