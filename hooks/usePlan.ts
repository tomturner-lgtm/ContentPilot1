import { useState, useEffect, useCallback } from 'react'

export type PlanType = 'free' | 'pro' | 'max'
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
  pro: 30, // Plan Pro payant avec Stripe : 30 articles
  max: 200, // Limite cachée, annoncé comme "illimité"
}

// Prix mensuels
export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  pro: 50,
  max: 100,
}

export function usePlan() {
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger le plan depuis localStorage
  const loadPlan = useCallback(() => {
    try {
      const stored = localStorage.getItem(PLAN_STORAGE_KEY)
      if (stored) {
        const planData: PlanData = JSON.parse(stored)
        setPlan(planData)
      } else {
        // Plan gratuit par défaut
        const defaultPlan: PlanData = {
          type: 'free',
          billingPeriod: 'monthly',
          startDate: new Date().toISOString().split('T')[0],
        }
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(defaultPlan))
        setPlan(defaultPlan)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du plan:', error)
      const defaultPlan: PlanData = {
        type: 'free',
        billingPeriod: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
      }
      setPlan(defaultPlan)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    if (!plan || plan.type === 'free') return 0
    const monthlyPrice = PLAN_PRICES[plan.type]
    return monthlyPrice * 11 // 1 mois gratuit = 11 mois payés
  }, [plan])

  // Obtenir le prix affiché selon la période de facturation
  const getDisplayPrice = useCallback(() => {
    if (!plan || plan.type === 'free') return 0
    return plan.billingPeriod === 'yearly'
      ? getYearlyPrice()
      : getMonthlyPrice()
  }, [plan, getMonthlyPrice, getYearlyPrice])

  // Vérifier si le plan est "illimité" (pour l'affichage)
  const isUnlimited = useCallback(() => {
    return plan?.type === 'max'
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
