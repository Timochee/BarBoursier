import { Router } from 'express';
import { adminRepository } from '../repositories';
import { superadminMiddleware, authMiddleware, AuthRequest, isAdminOrAbove } from '../middleware/auth';

const router = Router();

// GET /api/admins - List all admins (superadmin only)
router.get('/', superadminMiddleware as any, (_req, res) => {
  const admins = adminRepository.getAll();
  res.json(admins);
});

// POST /api/admins - Add a new admin (superadmin only)
router.post('/', superadminMiddleware as any, (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    res.status(400).json({ error: 'Email and name are required' });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already an admin
  if (adminRepository.isAdmin(normalizedEmail)) {
    res.status(409).json({ error: 'User is already an admin' });
    return;
  }

  const authReq = req as AuthRequest;
  const admin = adminRepository.add(normalizedEmail, name, authReq.user!.email);
  res.status(201).json(admin);
});

// DELETE /api/admins/:id - Remove an admin (superadmin only, or admin removing themselves)
router.delete('/:id', authMiddleware as any, (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid admin ID' });
    return;
  }

  // Get the admin to check permissions
  const admins = adminRepository.getAll();
  const adminToRemove = admins.find(a => a.id === id);

  if (!adminToRemove) {
    res.status(404).json({ error: 'Admin not found' });
    return;
  }

  const authReq = req as AuthRequest;

  // Check permissions: superadmin can remove anyone, admin can only remove themselves
  const isSuperadmin = authReq.user!.role === 'superadmin';
  const isSelfRemoval = adminToRemove.email === authReq.user!.email.toLowerCase();

  if (!isSuperadmin && !isSelfRemoval) {
    res.status(403).json({ error: 'Only superadmin can remove other admins' });
    return;
  }

  // Only admins can remove themselves (not guests trying to remove someone)
  if (isSelfRemoval && !isAdminOrAbove(authReq.user!.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  const removed = adminRepository.removeById(id);

  if (removed) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

export default router;
