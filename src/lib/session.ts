import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SessionPayload } from "./auth";

let cachedRequest: NextRequest | null = null;

export function setRequest(req: NextRequest) {
  cachedRequest = req;
}

export async function getSession(): Promise<SessionPayload | null> {
  // Try cookies() first (works in most contexts)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("saidit_token")?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) return decoded;
    }
  } catch {}

  // Fallback: parse Cookie header from the request
  if (cachedRequest) {
    const cookieHeader = cachedRequest.headers.get("cookie") || "";
    const match = cookieHeader.match(/saidit_token=([^;]+)/);
    if (match) {
      const decoded = verifyToken(match[1]);
      if (decoded) return decoded;
    }

    // Also check Authorization header (for bot API access)
    const authHeader = cachedRequest.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const decoded = verifyToken(authHeader.slice(7));
      if (decoded) return decoded;
    }
  }

  return null;
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function getTokenFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get("saidit_token")?.value;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) return decoded;
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/saidit_token=([^;]+)/);
  if (match) {
    return verifyToken(match[1]);
  }

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return verifyToken(authHeader.slice(7));
  }

  return null;
}
