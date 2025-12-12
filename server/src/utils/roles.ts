import type { Role } from 'shared';
import { adminRepository } from '../repositories';

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();

// Get user role based on email
export function getUserRole(email: string): Role {
  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return 'superadmin';
  }

  if (adminRepository.isAdmin(normalizedEmail)) {
    return 'admin';
  }

  return 'guest';
}

// Check if user has at least admin privileges
export function isAdminOrAbove(role: Role): boolean {
  return role === 'admin' || role === 'superadmin';
}
