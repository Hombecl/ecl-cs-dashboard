/**
 * Authentication utilities for CS Dashboard
 * Uses JWT tokens for session management
 */

import { SignJWT, jwtVerify } from 'jose';

// Secret key for JWT signing (must be set in environment)
const getSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Create a new session token
 * Token is valid for 24 hours
 */
export async function createSession(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());

  return token;
}

/**
 * Verify a session token
 * Returns true if token is valid, false otherwise
 */
export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate username and password against environment variables
 */
export function validateCredentials(username: string, password: string): boolean {
  const correctUsername = process.env.CS_DASHBOARD_USERNAME;
  const correctPassword = process.env.CS_DASHBOARD_PASSWORD;

  if (!correctUsername || !correctPassword) {
    console.error('CS_DASHBOARD_USERNAME or CS_DASHBOARD_PASSWORD environment variable is not set');
    return false;
  }

  return username === correctUsername && password === correctPassword;
}
