import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Créer le pool PostgreSQL uniquement si DATABASE_URL est défini
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
    })
    : undefined;

// Configuration de Better Auth avec PostgreSQL (Supabase)
export const auth = betterAuth({
    database: pool as any,
    emailAndPassword: {
        enabled: true,
        // Désactiver la vérification email pour simplifier le développement
        requireEmailVerification: false,
    },
    // Utiliser un secret par défaut pendant le build si non défini
    secret: process.env.BETTER_AUTH_SECRET || "build-time-placeholder-secret-change-me",
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 jours
        updateAge: 60 * 60 * 24, // Mettre à jour la session tous les jours
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache pendant 5 minutes
        },
    },
    user: {
        additionalFields: {
            name: {
                type: "string",
                required: false,
            },
        },
    },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
