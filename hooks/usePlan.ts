import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type PlanType = 'free' | 'test' | 'pro' | 'max'
export type BillingPeriod = 'monthly' | 'yearly'

const PLAN_STORAGE_KEY = 'contentflow_plan'

export interface PlanData {
  type: PlanType
  billingPeriod: BillingPeriod
  startDate: string
}

// Limites par plan (cachée dans le code pour Max)
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 1,
  test: 1, // Plan Test à 5€ : 1 article one-time
  pro: 30, // Plan Pro payant avec Stripe : 30 articles
  max: 200, // Limite cachée, annoncé comme "illimité"
}

// Prix mensuels (ou one-time pour 'test')
export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  test: 5, // Plan Test : 5€ one-time
  pro: 50,
  max: 100,
}

export function usePlan() {
  const supabase = createClientComponentClient()
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger le plan depuis la base de données (source de vérité)
  const loadPlan = useCallback(async () => {
    try {
      // 1. Charger depuis le localStorage pour un affichage immédiat (optimiste)
      const stored = localStorage.getItem(PLAN_STORAGE_KEY)
      if (stored) {
        setPlan(JSON.parse(stored))
      }

      // 2. Vérifier la session et charger depuis Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const { data, error } = await supabase
          .from('users')
          .select('plan, billing_period')
          .eq('auth_id', session.user.id)
          .single()

        if (data && !error) {
          const dbPlanType = data.plan as PlanType
          // Mettre à jour si différent
          const newPlan: PlanData = {
            type: dbPlanType || 'free',
            billingPeriod: data.billing_period || 'monthly',
            startDate: new Date().toISOString().split('T')[0]
          }

          setPlan(newPlan)
          localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(newPlan))
        }
      } else if (!stored) {
        // Pas de session et rien en cache -> Free/Test par défaut
        const defaultPlan: PlanData = {
          type: 'free',
          billingPeriod: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
        }
        setPlan(defaultPlan)
        // Ne pas persister le "default" en local si l'utilisateur n'est pas connecté pour ne pas polluer
      }
    } catch (error) {
      console.error('Erreur lors du chargement du plan:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Initialiser au montage
  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  // Mettre à jour le plan
  const updatePlan = useCallback(
    (type: PlanType, billingPeriod: BillingPeriod = 'monthly') => {
      const newPlan: PlanData = {
        type,
        billingPeriod,
        startDate: new Date().toISOString().split('T')[0],
      }
      try {
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(newPlan))
        setPlan(newPlan)
      } catch (error) {
        console.error('Erreur lors de la mise à jour du plan:', error)
      }
    },
    []
  )

  // Obtenir la limite du plan actuel
  const getLimit = useCallback(() => {
    if (!plan) return PLAN_LIMITS.free
    return PLAN_LIMITS[plan.type]
  }, [plan])

  // Obtenir le prix mensuel
  const getMonthlyPrice = useCallback(() => {
    if (!plan) return PLAN_PRICES.free
    return PLAN_PRICES[plan.type]
  }, [plan])

  // Obtenir le prix annuel (11 mois payés, 1 mois offert)
  const getYearlyPrice = useCallback(() => {
    if (!plan || plan.type === 'free' || plan.type === 'test') return 0
    const monthlyPrice = PLAN_PRICES[plan.type]
    return monthlyPrice * 11 // 1 mois gratuit = 11 mois payés
  }, [plan])

  // Obtenir le prix affiché selon la période de facturation
  const getDisplayPrice = useCallback(() => {
    if (!plan || plan.type === 'free') return 0
    // Le plan 'test' est un one-time purchase, pas un abonnement
    if (plan.type === 'test') return PLAN_PRICES.test
    return plan.billingPeriod === 'yearly'
      ? getYearlyPrice()
      : getMonthlyPrice()
  }, [plan, getMonthlyPrice, getYearlyPrice])

  // Vérifier si le plan est "illimité" (pour l'affichage)
  const isUnlimited = useCallback(() => {
    // Max n'est plus illimité (200 articles)
    return false
  }, [plan])

  return {
    plan,
    isLoading,
    updatePlan,
    getLimit,
    getMonthlyPrice,
    getYearlyPrice,
    getDisplayPrice,
    isUnlimited,
    currentPlanType: plan?.type || 'free',
    currentBillingPeriod: plan?.billingPeriod || 'monthly',
  }
}
