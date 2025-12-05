import { createAuthClient } from "better-auth/react";

// Déterminer l'URL de base selon l'environnement
const getBaseURL = () => {
    // En production sur Vercel/contentpilot.fr, utiliser l'URL relative
    // pour que les requêtes passent par le même domaine
    if (typeof window !== "undefined") {
        // Côté client, utiliser l'origine actuelle
        return window.location.origin;
    }
    // Côté serveur, utiliser la variable d'environnement
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

// Configuration du client auth pour le frontend
export const authClient = createAuthClient({
    baseURL: getBaseURL(),
});

// Export des hooks et fonctions utilitaires
export const { signIn, signUp, signOut, useSession } = authClient;
