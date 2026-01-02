import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Security configuration
export const securityConfig = {
  // Rate limiting
  rateLimits: {
    api: { requests: 100, window: 60000 }, // 100 requests per minute
    auth: { requests: 5, window: 300000 }, // 5 auth attempts per 5 minutes
    content: { requests: 50, window: 60000 }, // 50 content operations per minute
  },

  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
    mediaSrc: ["'self'", "blob:", "https:"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
  },

  // Input validation rules
  validation: {
    maxStringLength: 10000,
    maxArrayLength: 100,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'],
    allowedDomains: ['localhost', '127.0.0.1', 'creatornexus.com'],
  },

  // Encryption settings
  encryption: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 16,
  },

  // Session management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  }
};

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if under limit
    if (requests.length < this.maxRequests) {
      requests.push(now);
      this.requests.set(key, requests);
      return true;
    }

    return false;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  getRemainingRequests(key: string): number {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.maxRequests - validRequests.length);
  }

  getResetTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return Date.now();

    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.windowMs;
  }
}

// Global rate limiters
export const rateLimiters = {
  api: new RateLimiter(securityConfig.rateLimits.api.requests, securityConfig.rateLimits.api.window),
  auth: new RateLimiter(securityConfig.rateLimits.auth.requests, securityConfig.rateLimits.auth.window),
  content: new RateLimiter(securityConfig.rateLimits.content.requests, securityConfig.rateLimits.content.window),
};

// Input validation schemas
export const validationSchemas = {
  // User authentication
  login: z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  register: z.object({
    email: z.string().email('Invalid email format').min(1, 'Email is required'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),

  // Project creation
  project: z.object({
    name: z.string()
      .min(3, 'Project name must be at least 3 characters')
      .max(255, 'Project name must be less than 255 characters')
      .regex(/^[^<>&'"]*$/, 'Project name contains invalid characters'),
    description: z.string()
      .max(5000, 'Description must be less than 5000 characters')
      .optional(),
    contentType: z.enum(['fitness', 'tech', 'business', 'lifestyle', 'education', 'food', 'travel', 'fashion'], {
      errorMap: () => ({ message: 'Please select a valid content type' })
    }),
    category: z.enum(['educational', 'promotional', 'engagement', 'entertainment', 'informational'], {
      errorMap: () => ({ message: 'Please select a valid category' })
    }),
    channelTypes: z.array(z.string())
      .min(1, 'Please select at least one platform')
      .max(10, 'Maximum 10 platforms allowed'),
    duration: z.enum(['1week', '15days', '30days', 'custom']),
    customDuration: z.number()
      .min(1, 'Duration must be at least 1 day')
      .max(365, 'Duration cannot exceed 365 days')
      .optional(),
    contentFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
    targetAudience: z.string()
      .max(500, 'Target audience description too long')
      .optional(),
    tags: z.array(z.string())
      .max(20, 'Maximum 20 tags allowed')
      .optional(),
    isPublic: z.boolean(),
    notificationsEnabled: z.boolean(),
  }),

  // Content creation
  content: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters')
      .regex(/^[^<>&'"]*$/, 'Title contains invalid characters'),
    description: z.string()
      .max(5000, 'Description must be less than 5000 characters')
      .optional(),
    contentType: z.enum(['post', 'reel', 'short', 'story', 'video']),
    platform: z.string().min(1, 'Platform is required'),
    hashtags: z.array(z.string())
      .max(30, 'Maximum 30 hashtags allowed')
      .refine(tags => tags.every(tag => /^#[a-zA-Z0-9_]+$/.test(tag)), 'Invalid hashtag format'),
    scheduledAt: z.string().datetime('Invalid date format'),
    mediaUrls: z.array(z.string().url('Invalid URL format'))
      .max(10, 'Maximum 10 media files allowed')
      .optional(),
  }),

  // AI enhancement
  aiEnhancement: z.object({
    text: z.string()
      .min(1, 'Text is required')
      .max(10000, 'Text must be less than 10,000 characters'),
    field: z.string().min(1, 'Field is required'),
    context: z.object({
      contentType: z.string().optional(),
      platform: z.string().optional(),
      targetAudience: z.string().optional(),
      category: z.string().optional(),
    }).optional(),
  }),
};

// Input sanitization utilities
export const sanitizationUtils = {
  // Sanitize HTML content
  sanitizeHtml: (html: string): string => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  },

  // Sanitize text input
  sanitizeText: (text: string): string => {
    return text
      .replace(/[<>&'"]/g, '') // Remove potentially dangerous characters
      .trim()
      .substring(0, securityConfig.validation.maxStringLength);
  },

  // Sanitize filename
  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special characters with underscores
      .substring(0, 255); // Limit length
  },

  // Sanitize URL
  sanitizeUrl: (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      // Only allow specific protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      // Check against allowed domains
      if (!securityConfig.validation.allowedDomains.some(domain =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      )) {
        throw new Error('Domain not allowed');
      }
      return parsedUrl.toString();
    } catch {
      throw new Error('Invalid URL');
    }
  },

  // Sanitize email
  sanitizeEmail: (email: string): string => {
    const sanitized = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    return sanitized;
  },
};

// File validation utilities
export const fileValidationUtils = {
  // Validate file type
  isValidFileType: (file: File): boolean => {
    return securityConfig.validation.allowedFileTypes.includes(file.type);
  },

  // Validate file size
  isValidFileSize: (file: File): boolean => {
    return file.size <= securityConfig.validation.maxFileSize;
  },

  // Get file extension
  getFileExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  // Validate image dimensions (for security)
  validateImageDimensions: (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const { naturalWidth: width, naturalHeight: height } = img;

        // Check for reasonable dimensions (prevent extremely large images)
        if (width > 10000 || height > 10000) {
          reject(new Error('Image dimensions too large'));
          return;
        }

        // Check for suspiciously small images (might be tracking pixels)
        if (width < 10 || height < 10) {
          reject(new Error('Image dimensions too small'));
          return;
        }

        resolve({ width, height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Invalid image file'));
      };

      img.src = url;
    });
  },
};

// Authentication utilities
export const authUtils = {
  // Generate secure token
  generateSecureToken: (length: number = 32): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Hash password (client-side, for additional security)
  hashPassword: async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Validate session
  validateSession: (): boolean => {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');

    if (!token || !expiry) return false;

    return new Date(expiry) > new Date();
  },

  // Clear session
  clearSession: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
  },
};

// Error handling utilities
export const errorHandlingUtils = {
  // Standardized error messages
  errorMessages: {
    NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
    AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
    INVALID_FILE_TYPE: 'File type is not supported.',
    QUOTA_EXCEEDED: 'Usage quota exceeded. Please upgrade your plan.',
    FEATURE_DISABLED: 'This feature is currently disabled.',
  },

  // Create standardized error object
  createError: (type: keyof typeof errorHandlingUtils.errorMessages, details?: any): Error => {
    const error = new Error(errorHandlingUtils.errorMessages[type]);
    (error as any).type = type;
    (error as any).details = details;
    return error;
  },

  // Handle API errors
  handleApiError: (error: any): { message: string; type: string; retryable: boolean } => {
    if (error.status === 401) {
      authUtils.clearSession();
      return {
        message: errorHandlingUtils.errorMessages.AUTHENTICATION_ERROR,
        type: 'AUTHENTICATION_ERROR',
        retryable: false
      };
    }

    if (error.status === 403) {
      return {
        message: errorHandlingUtils.errorMessages.AUTHORIZATION_ERROR,
        type: 'AUTHORIZATION_ERROR',
        retryable: false
      };
    }

    if (error.status === 429) {
      return {
        message: errorHandlingUtils.errorMessages.RATE_LIMIT_ERROR,
        type: 'RATE_LIMIT_ERROR',
        retryable: true
      };
    }

    if (error.status >= 500) {
      return {
        message: errorHandlingUtils.errorMessages.SERVER_ERROR,
        type: 'SERVER_ERROR',
        retryable: true
      };
    }

    return {
      message: error.message || errorHandlingUtils.errorMessages.SERVER_ERROR,
      type: 'UNKNOWN_ERROR',
      retryable: true
    };
  },

  // Log errors (client-side logging)
  logError: (error: Error, context?: any): void => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service (e.g., Sentry)
      console.error('Error logged:', errorData);
    } else {
      console.error('Client Error:', errorData);
    }
  }
};

// CSRF protection utilities
export const csrfUtils = {
  // Generate CSRF token
  generateToken: (): string => {
    return authUtils.generateSecureToken(32);
  },

  // Store CSRF token
  storeToken: (token: string): void => {
    sessionStorage.setItem('csrfToken', token);
  },

  // Get CSRF token
  getToken: (): string | null => {
    return sessionStorage.getItem('csrfToken');
  },

  // Validate CSRF token
  validateToken: (token: string): boolean => {
    const storedToken = csrfUtils.getToken();
    return storedToken === token;
  }
};

// Data encryption utilities (for sensitive data)
export const encryptionUtils = {
  // Encrypt data
  encrypt: async (data: string, key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const keyBuffer = encoder.encode(key);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      dataBuffer
    );

    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode(...result));
  },

  // Decrypt data
  decrypt: async (encryptedData: string, key: string): Promise<string> => {
    try {
      const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = encrypted.slice(0, 12);
      const data = encrypted.slice(12);

      const encoder = new TextEncoder();
      const keyBuffer = encoder.encode(key);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }
};

// Security monitoring utilities
export const monitoringUtils = {
  // Track security events
  trackSecurityEvent: (event: string, details?: any): void => {
    const securityEvent = {
      event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      details
    };

    // Send to security monitoring service
    console.log('Security Event:', securityEvent);
  },

  // Check for suspicious activity
  detectSuspiciousActivity: (actions: any[]): boolean => {
    // Implement suspicious activity detection logic
    const recentActions = actions.filter(action =>
      new Date(action.timestamp) > new Date(Date.now() - 60000) // Last minute
    );

    // Check for rate limiting violations
    if (recentActions.length > 10) {
      monitoringUtils.trackSecurityEvent('RATE_LIMIT_VIOLATION', { actions: recentActions.length });
      return true;
    }

    // Check for unusual patterns
    const uniqueIPs = new Set(recentActions.map(action => action.ip));
    if (uniqueIPs.size > 5) {
      monitoringUtils.trackSecurityEvent('MULTIPLE_IP_ACTIVITY', { uniqueIPs: uniqueIPs.size });
      return true;
    }

    return false;
  }
};

// Export utilities for easy use
export const securityUtils = {
  rateLimiters,
  validationSchemas,
  sanitizationUtils,
  fileValidationUtils,
  authUtils,
  errorHandlingUtils,
  csrfUtils,
  encryptionUtils,
  monitoringUtils,
};
