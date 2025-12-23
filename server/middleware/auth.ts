/**
 * Authentication Middleware
 * 
 * Provides reusable authentication and authorization middleware
 * for protecting API routes.
 */

import type { Request, Response, NextFunction } from 'express';
import { getSupabaseClients } from '../lib/supabase-clients.js';
import type { UserRole } from '../../shared/database-types.js';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      token?: string;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware: Require authentication
 * Verifies the JWT token and attaches user info to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { supabaseAnon, supabaseAdmin } = getSupabaseClients();
    
    if (!supabaseAnon || !supabaseAdmin) {
      res.status(503).json({
        error: 'Service unavailable',
        message: 'Authentication service not configured',
      });
      return;
    }

    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing authorization token',
      });
      return;
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError?.message);
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      res.status(500).json({
        error: 'Internal error',
        message: 'Failed to fetch user profile',
      });
      return;
    }

    if (!profile) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User profile not found',
      });
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile.role as UserRole,
    };
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Middleware factory: Require specific roles
 * Must be used after requireAuth middleware
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Require staff role (admin, cfi, staff, founder, ops)
 */
export const requireStaff = requireRole('admin', 'cfi', 'staff', 'founder', 'ops');

/**
 * Middleware: Require admin role (admin, founder)
 */
export const requireAdmin = requireRole('admin', 'founder');

/**
 * Middleware: Optional authentication
 * Attempts to authenticate but doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  
  if (!token) {
    next();
    return;
  }

  const { supabaseAnon, supabaseAdmin } = getSupabaseClients();
  
  if (!supabaseAnon || !supabaseAdmin) {
    next();
    return;
  }

  try {
    const { data: { user } } = await supabaseAnon.auth.getUser(token);
    
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        req.user = {
          id: user.id,
          email: user.email || '',
          role: profile.role as UserRole,
        };
        req.token = token;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.warn('Optional auth check failed:', error);
  }

  next();
}

