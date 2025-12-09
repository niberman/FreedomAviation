/**
 * CORS Configuration Middleware
 * 
 * Centralized CORS handling for all API routes.
 */

import type { Request, Response, NextFunction } from 'express';
import { getAllowedOrigins } from '../config/env.js';

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl)
  
  const allowedOrigins = getAllowedOrigins();
  
  return (
    allowedOrigins.includes(origin) ||
    origin.startsWith('https://freedomaviationco.com') ||
    origin.startsWith('https://www.freedomaviationco.com') ||
    origin.startsWith('https://freedom-aviation.vercel.app') ||
    origin.startsWith('http://localhost:')
  );
}

/**
 * Set CORS headers on response
 */
export function setCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
}

/**
 * Middleware: Handle CORS for a specific route
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
}

/**
 * OPTIONS handler for preflight requests
 */
export function handlePreflight(req: Request, res: Response): void {
  setCorsHeaders(req, res);
  res.status(204).end();
}

