import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-4xl text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Badge Nouveau */}
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 mb-8">
            <span className="text-xs font-semibold text-slate-700 tracking-wide">✨ Nouveau</span>
            <span className="text-xs text-slate-500">Version 1.0</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">
              ContentPilot
            </span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Générez des articles de blog optimisés SEO en un clic avec l'IA.
            Créez du contenu professionnel en quelques secondes.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-slate-800 hover:scale-105 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Commencer maintenant
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:scale-105 transition-all duration-200"
            >
              Voir les plans
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
                Génération rapide
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Créez des articles de qualité en quelques secondes grâce à l'IA
                la plus avancée.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
                Contenu optimisé
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Articles structurés et optimisés SEO pour un meilleur référencement.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
                Plans flexibles
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Test (5€), Pro (10 articles) ou Max (illimité). Paiement mensuel ou annuel avec 1 mois offert.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
