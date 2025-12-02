export type TemplateType =
  | 'blog-classic'
  | 'review'
  | 'how-to'
  | 'list'
  | 'comparison'

export interface Template {
  id: TemplateType
  name: string
  description: string
  icon: string
  recommendedLength: number
  structure: string
  tone: string
  prompt: string
}

export const TEMPLATES: Record<TemplateType, Template> = {
  'blog-classic': {
    id: 'blog-classic',
    name: 'Blog Post Classique',
    description:
      'Article de blog traditionnel avec introduction, contexte, points clés et conclusion',
    icon: '📝',
    recommendedLength: 1000,
    structure: 'Introduction > Contexte > 3 Points clés > Conclusion',
    tone: 'Professionnel, engageant et informatif',
    prompt: `Structure de l'article :
1. Introduction accrocheuse (100-150 mots)
   - Hook captivant
   - Présentation du sujet
   - Problématique ou question centrale

2. Contexte et mise en situation (150-200 mots)
   - Pourquoi ce sujet est important
   - Contexte actuel
   - Enjeux principaux

3. Trois points clés développés (500-700 mots)
   - Point 1 : [Titre du point]
   - Point 2 : [Titre du point]
   - Point 3 : [Titre du point]
   Chaque point doit être développé avec des exemples et des détails

4. Conclusion avec appel à l'action (100-150 mots)
   - Synthèse des points principaux
   - Message à retenir
   - Appel à l'action ou question de réflexion`,
  },
  review: {
    id: 'review',
    name: 'Review de Produit',
    description:
      'Revue détaillée avec caractéristiques, avantages, inconvénients et verdict final',
    icon: '⭐',
    recommendedLength: 1200,
    structure: 'Introduction > Caractéristiques > Pros/Cons > Verdict',
    tone: 'Objectif, détaillé et honnête',
    prompt: `Structure de l'article :
1. Introduction (100-150 mots)
   - Présentation du produit/service
   - Contexte de test ou utilisation
   - Objectif de la review

2. Caractéristiques principales (300-400 mots)
   - Spécifications techniques/principales
   - Fonctionnalités clés
   - Design et ergonomie

3. Avantages et inconvénients (400-500 mots)
   - Les points forts (Pros)
     * Point fort 1
     * Point fort 2
     * Point fort 3
   - Les points faibles (Cons)
     * Point faible 1
     * Point faible 2
     * Point faible 3 (si applicable)

4. Verdict final (100-150 mots)
   - Recommandation globale
   - Public cible idéal
   - Note finale et justification`,
  },
  'how-to': {
    id: 'how-to',
    name: 'Guide How-To',
    description:
      'Guide pas à pas avec matériel nécessaire, étapes détaillées et astuces',
    icon: '🔧',
    recommendedLength: 1500,
    structure: 'Introduction > Matériel > Étapes > Tips > Conclusion',
    tone: 'Clair, pédagogique et actionnable',
    prompt: `Structure de l'article :
1. Introduction (100-150 mots)
   - Présentation du processus
   - Difficulté estimée
   - Temps nécessaire
   - Bénéfices attendus

2. Matériel/prérequis nécessaires (150-200 mots)
   - Liste des outils/ressources nécessaires
   - Prérequis ou compétences requises
   - Alternatives possibles

3. Étapes détaillées (800-1000 mots)
   Pour chaque étape :
   - Étape 1 : [Nom de l'étape]
     * Instructions détaillées
     * Points d'attention
   - Étape 2 : [Nom de l'étape]
     * Instructions détaillées
     * Points d'attention
   - Continuer avec toutes les étapes...

4. Astuces et erreurs à éviter (150-200 mots)
   - Conseils pratiques
   - Pièges courants
   - Optimisations possibles

5. Conclusion (100 mots)
   - Résumé du processus
   - Résultat final attendu
   - Prochaines étapes ou approfondissements`,
  },
  list: {
    id: 'list',
    name: 'Article de Liste (Top 10)',
    description:
      'Liste formatée avec numérotation, descriptions courtes et conclusion',
    icon: '📋',
    recommendedLength: 1200,
    structure: 'Introduction > Liste numérotée > Conclusion',
    tone: 'Dynamique, concis et scannable',
    prompt: `Structure de l'article :
1. Introduction (100-150 mots)
   - Présentation du sujet
   - Critères de sélection
   - Organisation de la liste

2. Liste numérotée (900-1000 mots)
   Pour chaque élément (10 éléments) :
   - #1 [Nom de l'élément]
     * Description (80-100 mots)
     * Caractéristiques principales
     * Pourquoi il est dans cette liste
   - #2 [Nom de l'élément]
     * Description (80-100 mots)
     * Caractéristiques principales
     * Pourquoi il est dans cette liste
   - Continuer jusqu'à #10...

3. Conclusion (100-150 mots)
   - Synthèse de la liste
   - Recommandation personnalisée
   - Appel à l'action`,
  },
  comparison: {
    id: 'comparison',
    name: 'Comparatif',
    description:
      'Comparaison détaillée entre plusieurs options avec tableau récapitulatif',
    icon: '⚖️',
    recommendedLength: 1500,
    structure: 'Introduction > Critères > Comparaison > Recommandation',
    tone: 'Analytique, équilibré et factuel',
    prompt: `Structure de l'article :
1. Introduction (100-150 mots)
   - Présentation des options à comparer
   - Objectif de la comparaison
   - Critères d'évaluation utilisés

2. Critères de comparaison (200 mots)
   - Liste des critères retenus
   - Importance de chaque critère
   - Méthodologie de comparaison

3. Comparaison détaillée (900-1100 mots)
   Pour chaque option (2-3 options) :
   - Option 1 : [Nom]
     * Présentation générale
     * Évaluation par critère :
       - Critère 1 : [Évaluation]
       - Critère 2 : [Évaluation]
       - Critère 3 : [Évaluation]
       etc.
     * Points forts
     * Points faibles
   - Option 2 : [Nom]
     * (même structure)
   - Option 3 : [Nom] (si applicable)
     * (même structure)

4. Tableau récapitulatif (sous forme de liste)
   Présenter un résumé comparatif clair

5. Recommandation finale (150 mots)
   - Synthèse comparative
   - Recommandation selon différents besoins
   - Verdict final avec justification`,
  },
}

export const getTemplate = (id: TemplateType): Template => {
  return TEMPLATES[id]
}

export const getDefaultTemplate = (): Template => {
  return TEMPLATES['blog-classic']
}