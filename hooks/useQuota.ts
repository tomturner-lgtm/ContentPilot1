import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePlan, PLAN_LIMITS } from './usePlan'

const STORAGE_KEY = 'contentflow_quota'

interface QuotaData {
  count: number
  lastReset: string
}

export function useQuota() {
  const plan = usePlan()
  const [quota, setQuota] = useState<QuotaData>({ count: 0, lastReset: '' })
  const [isLoading, setIsLoading] = useState(true)

  // Obtenir la limite selon le plan actuel (recalculé quand le plan change)
  const quotaLimit = useMemo(() => {
    if (!plan.plan || plan.isLoading) return PLAN_LIMITS.free
    return PLAN_LIMITS[plan.plan.type]
  }, [plan.plan?.type, plan.isLoading])

  // Vérifier si on est dans un nouveau mois
  const shouldReset = useCallback((lastReset: string): boolean => {
    if (!lastReset) return true
    
    const lastResetDate = new Date(lastReset)
    const now = new Date()
    
    return (
      lastResetDate.getMonth() !== now.getMonth() ||
      lastResetDate.getFullYear() !== now.getFullYear()
    )
  }, [])

  // Initialiser ou réinitialiser le quota
  const initializeQuota = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      
      if (stored) {
        const quotaData: QuotaData = JSON.parse(stored)
        
        if (shouldReset(quotaData.lastReset)) {
          // Reset du quota pour le nouveau mois
          const newQuota: QuotaData = {
            count: 0,
            lastReset: new Date().toISOString().split('T')[0],
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuota))
          setQuota(newQuota)
        } else {
          setQuota(quotaData)
        }
      } else {
        // Premier utilisateur
        const newQuota: QuotaData = {
          count: 0,
          lastReset: new Date().toISOString().split('T')[0],
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuota))
        setQuota(newQuota)
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du quota:', error)
      setQuota({ count: 0, lastReset: new Date().toISOString().split('T')[0] })
    } finally {
      setIsLoading(false)
    }
  }, [shouldReset])

  // Charger le quota au montage
  useEffect(() => {
    initializeQuota()
  }, [initializeQuota])

  // Incrémenter le quota
  const incrementQuota = useCallback(() => {
    try {
      const newQuota: QuotaData = {
        count: quota.count + 1,
        lastReset: quota.lastReset,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuota))
      setQuota(newQuota)
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation du quota:', error)
    }
  }, [quota])

  // Mettre à jour la limite quand le plan change
  useEffect(() => {
    if (!plan.isLoading && plan.plan) {
      // Si on change de plan, on pourrait vouloir réinitialiser le quota
      // Pour l'instant, on garde le quota actuel
    }
  }, [plan])

  // Vérifier si le quota est disponible
  const canGenerate = useCallback(() => {
    return quota.count < quotaLimit
  }, [quota, quotaLimit])

  // Obtenir le pourcentage utilisé
  const getUsagePercentage = useCallback(() => {
    if (quotaLimit === 0) return 0
    return Math.min(100, (quota.count / quotaLimit) * 100)
  }, [quota, quotaLimit])

  // Obtenir le nombre d'articles restants
  const getRemaining = useCallback(() => {
    return Math.max(0, quotaLimit - quota.count)
  }, [quota, quotaLimit])

  return {
    count: quota.count,
    limit: quotaLimit,
    remaining: getRemaining(),
    usagePercentage: getUsagePercentage(),
    canGenerate: canGenerate(),
    isLoading: isLoading || plan.isLoading,
    incrementQuota,
    lastReset: quota.lastReset,
    planType: plan.plan?.type || 'free',
  }
}
