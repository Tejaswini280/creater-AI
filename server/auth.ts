import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AuthRequest extends Request {
  user?: User;
}

// JWT Secrets - In production, use strong secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "1h";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Password verification
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT access token
export function generateAccessToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY as any }
  );
}

// Generate JWT refresh token
export function generateRefreshToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY as any }
  );
}

// Generate both access and refresh tokens
export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
}

// Legacy function for backward compatibility
export function generateToken(user: User): string {
  return generateAccessToken(user);
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: User } | null> {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return null;
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId)
    });

    if (!user) {
      return null;
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);
    
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      }
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Authentication middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Try to get token from cookies first (secure), then fall back to Authorization header
  const token = req.cookies?.access_token || (req.headers["authorization"]?.split(" ")[1]);
  
  console.log('🔍 Auth Debug - Cookies:', req.cookies);
  console.log('🔍 Auth Debug - Authorization header:', req.headers["authorization"]);
  console.log('🔍 Auth Debug - Extracted token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({ message: "Access token required" });
  }

  // Development mode: Allow test tokens for testing
  if (process.env.NODE_ENV === 'development' && (token === 'test-token' || token === 'DasbQzUx4Xin' || token === 'test-user' || token === '_mmZ3s7MoENJ')) {
    console.log('🔧 Development mode: Using test token for authentication');
    req.user = {
      id: 'EAzLepQUX10UODF54_Ge-', // Use test user ID from database
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  try {
    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId)
    });

    if (!user) {
      // Handle fallback user for development when database is not available
      if (decoded.userId === 'fallback-user-id') {
        console.log('Using fallback user for authentication');
        req.user = {
          id: 'fallback-user-id',
          email: decoded.email || 'fallback@example.com',
          firstName: 'Fallback',
          lastName: 'User',
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return next();
      }
      return res.status(403).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    // Handle fallback for database connection errors
    if (decoded.userId === 'fallback-user-id') {
      console.log('Using fallback user due to database error');
      req.user = {
        id: 'fallback-user-id',
        email: decoded.email || 'fallback@example.com',
        firstName: 'Fallback',
        lastName: 'User',
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return next();
    }
    return res.status(500).json({ message: "Authentication failed" });
  }
}

// Optional authentication middleware (for routes that can work with or without auth)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Try to get token from cookies first (secure), then fall back to Authorization header
  const token = req.cookies?.access_token || (req.headers["authorization"]?.split(" ")[1]);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, decoded.userId)
        });
        if (user) {
          req.user = user;
        }
      } catch (error) {
        console.error("Optional auth error:", error);
      }
    }
  }

  next();
} 