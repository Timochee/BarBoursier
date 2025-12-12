import jwt from 'jsonwebtoken';
import type { Role } from 'shared';
import { getUserRole } from '../utils/roles';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  role: Role;
}

export interface JWTPayload {
  email: string;
  name: string;
  picture: string;
}

// Generate JWT token for authenticated user
export function generateToken(user: Omit<AuthUser, 'role'>): string {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token and return payload
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Verify JWT token for Socket.io authentication (returns full AuthUser)
export function verifySocketToken(token: string): AuthUser | null {
  const payload = verifyToken(token);
  if (!payload) return null;

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    role: getUserRole(payload.email),
  };
}

// Build AuthUser from JWT payload (fetches role fresh from DB)
export function buildAuthUser(payload: JWTPayload): AuthUser {
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    role: getUserRole(payload.email),
  };
}
