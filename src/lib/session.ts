import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, SessionPayload } from "./auth";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("saidit_token")?.value;
  if (!token) return null;
  return verifyToken(token);
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
  if (!token) return null;
  return verifyToken(token);
}
