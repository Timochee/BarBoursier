import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from '../logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

export interface AdminUser {
  email: string;
  name: string;
  picture: string;
}

export interface AuthRequest extends Request {
  isAdmin?: boolean;
  adminUser?: AdminUser;
}

export interface GoogleProfile {
  id: string;
  emails?: { value: string; verified: boolean }[];
  displayName: string;
  photos?: { value: string }[];
}

// Check if email is in the admin whitelist
export function isEmailAllowed(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Check if OAuth credentials are properly configured
export function isOAuthConfigured(): boolean {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return !!(clientID && clientSecret && clientID !== 'your-google-client-id');
}

// Configure Google OAuth Strategy
export function configurePassport(): void {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const serverPort = process.env.PORT || '3001';
  // In development, callback goes to server directly; in production, adjust as needed
  const callbackURL = process.env.OAUTH_CALLBACK_URL || `http://localhost:${serverPort}/api/auth/google/callback`;

  if (!isOAuthConfigured()) {
    logger.warn('Google OAuth not configured');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientID!,
        clientSecret: clientSecret!,
        callbackURL,
      },
      (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: (error: Error | null, user?: AdminUser | false) => void) => {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Allow any Google user to login, admin check is done separately
        const user = {
          email,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value || '',
        };

        return done(null, user);
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });
}

interface JWTPayload {
  email: string;
  name: string;
  picture: string;
  role: string;
}

// Extract and verify token from request (DRY - used by both middlewares)
function extractAndVerifyToken(req: Request): { payload: JWTPayload } | { error: string; status: 401 | 403 } {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return { payload };
  } catch {
    return { error: 'Invalid token', status: 401 };
  }
}

// Populate request with user info from JWT payload
function populateRequestFromPayload(req: AuthRequest, payload: JWTPayload): void {
  req.adminUser = { email: payload.email, name: payload.name, picture: payload.picture };
  req.isAdmin = payload.role === 'admin' && isEmailAllowed(payload.email);
}

// JWT auth middleware - allows any authenticated user
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const result = extractAndVerifyToken(req);

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  populateRequestFromPayload(req, result.payload);
  next();
}

// Admin-only middleware - requires admin role
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const result = extractAndVerifyToken(req);

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  const { payload } = result;
  const isAdmin = payload.role === 'admin' && isEmailAllowed(payload.email);

  if (!isAdmin) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  populateRequestFromPayload(req, payload);
  next();
}

// Generate JWT token for authenticated user
export function generateToken(user: AdminUser): string {
  const isAdmin = isEmailAllowed(user.email);
  return jwt.sign({
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: isAdmin ? 'admin' : 'user'
  }, JWT_SECRET, { expiresIn: '7d' });
}
