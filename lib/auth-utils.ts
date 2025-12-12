/**
 * Utilitaires pour la gestion de l'authentification et du cache utilisateur
 */

// Clés localStorage utilisées par l'application
const CACHE_KEYS = [
  'contentflow_plan',
  'contentflow_quota',
  'contentflow_user_id',
  'contentflow_articles',
] as const

/**
 * Nettoie tout le cache utilisateur de localStorage
 * À appeler lors de la déconnexion ou du changement d'utilisateur
 */
export function clearUserCache(): void {
  console.log('🧹 Nettoyage complet du cache utilisateur')
  
  CACHE_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`  ✓ ${key} supprimé`)
    } catch (error) {
      console.error(`  ✗ Erreur suppression ${key}:`, error)
    }
  })
}

/**
 * Vérifie si le cache appartient à l'utilisateur actuel
 * @param currentUserId - L'ID de l'utilisateur authentifié
 * @returns true si le cache correspond, false sinon
 */
export function isCacheValid(currentUserId: string): boolean {
  try {
    const storedUserId = localStorage.getItem('contentflow_user_id')
    return storedUserId === currentUserId
  } catch {
    return false
  }
}

/**
 * Met à jour l'ID utilisateur dans le cache
 * @param userId - L'ID de l'utilisateur à sauvegarder
 */
export function setCurrentUserId(userId: string): void {
  try {
    localStorage.setItem('contentflow_user_id', userId)
  } catch (error) {
    console.error('Erreur sauvegarde user ID:', error)
  }
}

/**
 * Récupère l'ID utilisateur du cache
 */
export function getCachedUserId(): string | null {
  try {
    return localStorage.getItem('contentflow_user_id')
  } catch {
    return null
  }
}

