import { createAuthClient } from "better-auth/react";

// Configuration du client auth pour le frontend
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export des hooks et fonctions utilitaires
export const { signIn, signUp, signOut, useSession } = authClient;
