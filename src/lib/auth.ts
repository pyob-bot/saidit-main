import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "saidit-dev-secret-key-change-in-production";

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
}

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
