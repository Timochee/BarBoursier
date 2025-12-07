import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { generateToken, authMiddleware, AuthRequest, isOAuthConfigured } from '../middleware/auth';

const router = Router();

// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!isOAuthConfigured()) {
    res.status(503).json({
      error: 'Google OAuth not configured',
      message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
    });
    return;
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!isOAuthConfigured()) {
    res.redirect(`${clientUrl}?auth_error=${encodeURIComponent('Google OAuth not configured')}`);
    return;
  }

  passport.authenticate('google', { session: false }, (err: Error | null, user: { email: string; name: string; picture: string } | false) => {
    if (err) {
      console.error('Google OAuth error:', err.message);
      res.redirect(`${clientUrl}?auth_error=${encodeURIComponent(err.message)}`);
      return;
    }

    if (!user) {
      res.redirect(`${clientUrl}?auth_error=Authentication failed`);
      return;
    }

    // Generate JWT token for the authenticated user
    const token = generateToken(user);

    // Redirect to client with token
    res.redirect(`${clientUrl}?auth_token=${token}`);
  })(req, res, next);
});

// GET /api/auth/verify - Verify if token is still valid
router.get('/verify', authMiddleware as any, (req: AuthRequest, res: Response) => {
  res.json({ valid: true, isAdmin: req.isAdmin, user: req.adminUser });
});

// POST /api/auth/logout - Logout (client-side token removal, but useful for logging)
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

// GET /api/auth/status - Check if OAuth is configured
router.get('/status', (req: Request, res: Response) => {
  res.json({
    oauthConfigured: isOAuthConfigured(),
  });
});

export default router;
