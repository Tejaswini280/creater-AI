/**
 * Tests for enhanced authentication system
 * Tests security improvements and removal of test token bypass
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, verifyToken, generateAccessToken, hashPassword, verifyPassword } from '../auth';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn()
      }
    }
  }
}));

const mockDb = require('../db').db;

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await verifyPassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate JWT token', () => {
      const userId = 'user123';
      const token = 'generatedtoken';
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = generateAccessToken(userId);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(result).toBe(token);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = 'validtoken';
      const decoded = { userId: 'user123', iat: 1234567890, exp: 1234567900 };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      const result = verifyToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toBe(decoded);
    });

    it('should return null for invalid token', () => {
      const token = 'invalidtoken';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe('authenticateToken', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        headers: {},
        user: undefined
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should reject request without authorization header', async () => {
      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request without Bearer token', async () => {
      mockReq.headers.authorization = 'InvalidToken';

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access token required' });
    });

    it('should reject invalid JWT tokens', async () => {
      mockReq.headers.authorization = 'Bearer invalid.jwt.token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject tokens for non-existent users', async () => {
      mockReq.headers.authorization = 'Bearer valid.jwt.token';
      const decoded = { userId: 'nonexistent' };
      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      mockDb.query.users.findFirst.mockResolvedValue(null);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should authenticate valid tokens', async () => {
      mockReq.headers.authorization = 'Bearer valid.jwt.token';
      const decoded = { userId: 'user123' };
      const user = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      mockDb.query.users.findFirst.mockResolvedValue(user);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBe(user);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockReq.headers.authorization = 'Bearer valid.jwt.token';
      const decoded = { userId: 'user123' };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);
      mockDb.query.users.findFirst.mockRejectedValue(new Error('Database error'));

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication failed' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    // Test that test token bypass has been removed
    it('should NOT accept test tokens', async () => {
      mockReq.headers.authorization = 'Bearer test-token';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should NOT accept DasbQzUx4Xin test token', async () => {
      mockReq.headers.authorization = 'Bearer DasbQzUx4Xin';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
