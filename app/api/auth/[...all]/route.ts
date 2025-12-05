import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export des handlers GET et POST pour Better Auth
export const { GET, POST } = toNextJsHandler(auth.handler);
