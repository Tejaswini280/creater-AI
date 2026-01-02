/**
 * Tests for enhanced validation middleware
 * Tests security improvements and input sanitization
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  sanitizeInput,
  validateInputSize,
  validateInput,
  validationSchemas,
  createRateLimitOptions
} from '../validation';

describe('Validation Middleware', () => {
  describe('sanitizeInput', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should sanitize HTML tags from input', () => {
      mockReq.body = {
        title: '<script>alert("xss")</script>Hello World',
        description: '<b>Bold text</b> with <i>italic</i>'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.title).toBe('Hello World');
      expect(mockReq.body.description).toBe('Bold text with italic');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect and block malicious input', () => {
      mockReq.body = {
        title: 'Test<script>alert("xss")</script>'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Potentially malicious input detected')
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle XSS attack vectors', () => {
      mockReq.body = {
        title: '<img src=x onerror=alert(1)>'
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should sanitize array fields', () => {
      mockReq.body = {
        tags: ['<script>tag1</script>', 'tag2', '<b>tag3</b>']
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should trim whitespace from all fields', () => {
      mockReq.body = {
        title: '  Test Title  ',
        description: '  Test Description  ',
        tags: ['  tag1  ', '  tag2  ']
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.title).toBe('Test Title');
      expect(mockReq.body.description).toBe('Test Description');
      expect(mockReq.body.tags).toEqual(['tag1', 'tag2']);
    });

    it('should handle nested objects', () => {
      mockReq.body = {
        metadata: {
          title: '  <b>Test</b>  ',
          description: '  Description  '
        }
      };

      sanitizeInput(mockReq, mockRes, mockNext);

      expect(mockReq.body.metadata.title).toBe('Test');
      expect(mockReq.body.metadata.description).toBe('Description');
    });
  });

  describe('validateInputSize', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should allow requests under size limit', () => {
      mockReq.headers['content-length'] = '1000000'; // 1MB

      validateInputSize(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should block requests over size limit', () => {
      mockReq.headers['content-length'] = '15000000'; // 15MB

      validateInputSize(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request payload too large'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate object depth', () => {
      // Create deeply nested object
      let deepObj: any = { level: 1 };
      for (let i = 0; i < 15; i++) {
        deepObj = { nested: deepObj };
      }
      mockReq.body = deepObj;
      mockReq.headers['content-length'] = '1000';

      validateInputSize(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Request structure too complex'
      });
    });
  });

  describe('validateInput', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      mockNext = jest.fn();
    });

    it('should validate successful input', () => {
      mockReq.body = {
        name: 'Test Project',
        description: 'Test description',
        type: 'video',
        tags: ['tag1', 'tag2']
      };

      validateInput(validationSchemas.project)(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual(mockReq.body);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return validation errors for invalid input', () => {
      mockReq.body = {
        name: '', // Invalid: too short
        type: 'invalid-type', // Invalid: not in enum
        tags: 'not-an-array' // Invalid: not an array
      };

      validateInput(validationSchemas.project)(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'type' }),
          expect.objectContaining({ field: 'tags' })
        ])
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('createRateLimitOptions', () => {
    it('should create rate limit options object', () => {
      const options = createRateLimitOptions(15 * 60 * 1000, 100); // 15 minutes, 100 requests

      expect(options).toEqual({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
          success: false,
          message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
    });
  });
});
