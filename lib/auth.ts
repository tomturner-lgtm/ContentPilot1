import { betterAuth } from "better-auth";
import { Pool } from "pg";

// ========================================
// DEBUG LOGS - Configuration
// ========================================
console.log("=== BETTER AUTH CONFIGURATION DEBUG ===");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);
console.log("BETTER_AUTH_SECRET exists:", !!process.env.BETTER_AUTH_SECRET);
console.log("BETTER_AUTH_SECRET length:", process.env.BETTER_AUTH_SECRET?.length || 0);
console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "NOT SET");
console.log("NODE_ENV:", process.env.NODE_ENV);

// Créer le pool PostgreSQL avec support SSL pour Railway/Supabase
let pool: Pool | undefined;

try {
    if (process.env.DATABASE_URL) {
        console.log("Creating PostgreSQL Pool...");
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false,
            },
        });
        console.log("PostgreSQL Pool created successfully");

        // Test de connexion (async, ne bloque pas)
        pool.query('SELECT 1')
            .then(() => console.log("Database connection test: SUCCESS"))
            .catch((err) => console.error("Database connection test: FAILED", err.message));
    } else {
        console.warn("DATABASE_URL not set - Pool not created");
    }
} catch (error) {
    console.error("Error creating PostgreSQL Pool:", error);
}

// Liste des origines autorisées
const trustedOrigins = [
    "http://localhost:3000",
    "https://contentpilot.fr",
    "https://www.contentpilot.fr",
    "https://contentpilot1-production.up.railway.app",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
].filter(Boolean);

console.log("Trusted origins:", trustedOrigins);

// Configuration de Better Auth
let auth: ReturnType<typeof betterAuth>;

try {
    console.log("Creating Better Auth instance...");

    auth = betterAuth({
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

    console.log("Better Auth instance created successfully");
} catch (error) {
    console.error("=== BETTER AUTH CREATION ERROR ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
}

console.log("=== END BETTER AUTH DEBUG ===");

export { auth };
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
