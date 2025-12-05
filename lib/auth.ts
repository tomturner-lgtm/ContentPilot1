import { betterAuth } from "better-auth";
import { Pool } from "pg";

// ========================================
// DEBUG LOGS
// ========================================
console.log("=== BETTER AUTH CONFIGURATION ===");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("BETTER_AUTH_SECRET exists:", !!process.env.BETTER_AUTH_SECRET);
console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);

// Créer le pool PostgreSQL avec support SSL pour Supabase
let pool: Pool | undefined;

if (process.env.DATABASE_URL) {
    try {
        // Log le hostname pour debug
        const url = new URL(process.env.DATABASE_URL);
        console.log("Database host:", url.hostname);
        console.log("Database port:", url.port);

        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
            // Timeout plus court pour les serverless
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 10000,
            max: 1, // Une seule connexion pour serverless
        });

        console.log("PostgreSQL Pool created");
    } catch (error) {
        console.error("Failed to create Pool:", error);
    }
} else {
    console.warn("DATABASE_URL not set");
}

// Origines autorisées
const trustedOrigins = [
    "http://localhost:3000",
    "https://contentpilot.fr",
    "https://www.contentpilot.fr",
    process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

// Configuration Better Auth
let auth: ReturnType<typeof betterAuth>;

try {
    auth = betterAuth({
        database: pool as any,
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false,
        },
        secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
        baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        trustedOrigins,
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
            expiresIn: 60 * 60 * 24 * 7,
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
    console.log("Better Auth initialized successfully");
} catch (error) {
    console.error("Better Auth initialization failed:", error);
    throw error;
}

export { auth };
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
