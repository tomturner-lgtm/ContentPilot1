import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handler = toNextJsHandler(auth.handler);

// Liste des origines autorisées pour CORS
const allowedOrigins = [
    "http://localhost:3000",
    "https://contentpilot.fr",
    "https://www.contentpilot.fr",
    "https://contentpilot1-production.up.railway.app",
];

function getCorsHeaders(origin: string | null) {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
    };

    // Vérifier si l'origine est autorisée
    if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    } else if (origin && origin.endsWith(".contentpilot.fr")) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
}

// Gérer les requêtes OPTIONS (preflight)
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

// Wrapper pour ajouter les headers CORS aux réponses
async function withCors(request: NextRequest, handlerFn: (req: NextRequest) => Promise<Response>) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    const response = await handlerFn(request);

    // Cloner la réponse avec les headers CORS
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

export async function GET(request: NextRequest) {
    return withCors(request, handler.GET);
}

export async function POST(request: NextRequest) {
    return withCors(request, handler.POST);
}
