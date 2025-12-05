import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Créer le pool PostgreSQL uniquement si DATABASE_URL est défini
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
    })
    : undefined;

// Liste des origines autorisées
const trustedOrigins = [
    "http://localhost:3000",
    "https://contentpilot.fr",
    "https://www.contentpilot.fr",
    "https://contentpilot1-production.up.railway.app",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
].filter(Boolean);

// Configuration de Better Auth avec PostgreSQL (Supabase)
export const auth = betterAuth({
    database: pool as any,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    secret: process.env.BETTER_AUTH_SECRET || "build-time-placeholder-secret-change-me",
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trustedOrigins: trustedOrigins,
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
        },
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 jours
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
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
