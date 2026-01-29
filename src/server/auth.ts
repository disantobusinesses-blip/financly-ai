/**
 * Server-side authentication utilities
 * Used by Vercel serverless API routes
 */

export function getBearerToken(req: any): string | null {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h) return null;
  
  const s = String(h);
  if (!s.toLowerCase().startsWith("bearer ")) return null;
  
  return s.slice(7).trim();
}

export function validateAuthToken(token: string): boolean {
  // Implement your token validation logic here
  // For now, check if token exists and is non-empty
  return token && token.length > 0;
}

export interface AuthContext {
  userId: string;
  token: string;
}

export function extractAuthContext(req: any): AuthContext | null {
  const token = getBearerToken(req);
  
  if (!token || !validateAuthToken(token)) {
    return null;
  }
  
  // Extract userId from token or request
  // Adjust based on your authentication system
  const userId = req.query?.userId || req.body?.userId;
  
  if (!userId) {
    return null;
  }
  
  return { userId, token };
}