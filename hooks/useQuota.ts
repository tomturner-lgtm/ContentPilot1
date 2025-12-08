import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { usePlan, PLAN_LIMITS } from './usePlan'

const STORAGE_KEY = 'contentflow_quota'

interface QuotaData {
  count: number
  lastReset: string
}

export function useQuota() {
  const plan = usePlan()
  const supabase = createClientComponentClient()
  const [quota, setQuota] = useState<QuotaData>({ count: 0, lastReset: '' })
  const [loading, setLoading] = useState(true)

  // Obtenir la limite selon le plan actuel
  // On utilise la limite du plan défini dans usePlan pour l'affichage cohérent
  // mais on utilisera aussi les données serveur si disponibles
  const quotaLimit = useMemo(() => {
    if (!plan.plan || plan.isLoading) return PLAN_LIMITS.free
    return PLAN_LIMITS[plan.plan.type]
  }, [plan.plan?.type, plan.isLoading])

  // Charger le quota depuis le serveur
  const fetchQuota = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Lire directement depuis la table users (pas RPC)
        const { data, error } = await supabase
          .from('users')
          .select('articles_used, articles_limit, plan, quota_reset_date')
          .eq('auth_id', session.user.id)
          .single()

        if (data && !error) {
          console.log('📊 useQuota data:', {
            articlesUsed: data.articles_used,
            articlesLimit: data.articles_limit,
            plan: data.plan,
            quotaResetDate: data.quota_reset_date
          })
          // Mettre à jour avec les données serveur
          setQuota({
            count: data.articles_used || 0,
            lastReset: data.quota_reset_date || ''
          })
          // Sync localStorage pour offline/fallback
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            count: data.articles_used || 0,
            lastReset: data.quota_reset_date || ''
          }))
        } else if (error) {
          console.error('❌ useQuota error:', error)
        }
      } else {
        // Fallback localStorage si non connecté (pour démo/test)
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setQuota(JSON.parse(stored))
        }
      }
    } catch (error) {
      console.error('Erreur chargement quota:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Charger au montage et quand le user change
  useEffect(() => {
    fetchQuota()
  }, [fetchQuota])

  // Incrémenter le quota (optimiste + serveur)
  const incrementQuota = useCallback(async () => {
    // 1. Mise à jour optimiste
    setQuota(prev => {
      const next = { ...prev, count: prev.count + 1 }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })

    // 2. Le vrai compte sera mis à jour au prochain fetch ou par le refresh
    // On peut aussi forcer un refresh après un court délai pour être sûr
    setTimeout(() => {
      fetchQuota()
    }, 1000)
  }, [fetchQuota])

  // Obtenir le pourcentage utilisé
  const getUsagePercentage = useCallback(() => {
    if (quotaLimit === 0) return 100
    // S'assurer qu'on ne dépasse pas 100% visuellement
    return Math.min(100, (quota.count / quotaLimit) * 100)
  }, [quota.count, quotaLimit])

  // Obtenir le nombre d'articles restants
  const getRemaining = useCallback(() => {
    return Math.max(0, quotaLimit - quota.count)
  }, [quota.count, quotaLimit])

  return {
    count: quota.count,
    limit: quotaLimit,
    remaining: getRemaining(),
    usagePercentage: getUsagePercentage(),
    canGenerate: quota.count < quotaLimit,
    isLoading: loading || plan.isLoading,
    incrementQuota,
    refreshQuota: fetchQuota, // Expose refresh function
    lastReset: quota.lastReset,
    planType: plan.plan?.type || 'free',
  }
}
