import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

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
    console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
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

// JWT auth middleware - allows any authenticated user
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.adminUser = { email: decoded.email, name: decoded.name, picture: decoded.picture };
    req.isAdmin = decoded.role === 'admin' && isEmailAllowed(decoded.email);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin-only middleware - requires admin role
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    if (decoded.role === 'admin' && isEmailAllowed(decoded.email)) {
      req.isAdmin = true;
      req.adminUser = { email: decoded.email, name: decoded.name, picture: decoded.picture };
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
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
