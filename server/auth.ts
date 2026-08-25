import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { UserWithProfile } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'yao-sgmail-super-secret-production-key-2026';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: UserWithProfile;
}

export function generateToken(user: { id: string; email: string; role: 'user' | 'admin' }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Autentikasi diperlukan. Silakan login.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: 'Sesi kedaluwarsa atau token tidak valid.' });
    return;
  }

  const user = db.getUserById(payload.userId);
  if (!user) {
    res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
    return;
  }

  if (!user.active) {
    res.status(403).json({
      success: false,
      message: 'Akun Anda sedang dinonaktifkan/disuspend. Silakan hubungi Admin.',
    });
    return;
  }

  req.user = user;
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Akses ditolak. Halaman atau aksi ini hanya untuk Administrator.',
    });
    return;
  }
  next();
}
