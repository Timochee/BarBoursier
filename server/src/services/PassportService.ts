import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from '../logger';
import type { AuthUser } from './TokenService';

export interface GoogleProfile {
  id: string;
  emails?: { value: string; verified: boolean }[];
  displayName: string;
  photos?: { value: string }[];
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
  const callbackURL =
    process.env.OAUTH_CALLBACK_URL || `http://localhost:${serverPort}/api/auth/google/callback`;

  logger.info({ callbackURL, superadmin: process.env.SUPERADMIN_EMAIL }, 'OAuth config');

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
      (
        _accessToken: string,
        _refreshToken: string,
        profile: GoogleProfile,
        done: (error: Error | null, user?: Omit<AuthUser, 'role'> | false) => void
      ) => {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

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
