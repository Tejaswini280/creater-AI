import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet, { type HelmetOptions } from 'helmet';
import cors, { type CorsOptions } from 'cors';
import { z } from 'zod';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

// API Key management
interface ApiKeyInfo {
  key: string;
  userId: string;
  permissions: string[];
  createdAt: Date;
  lastUsed: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// In-memory storage for API keys (in production, use Redis or database)
const apiKeyStore = new Map<string, ApiKeyInfo>();

// Generate new API key
export const generateApiKey = (userId: string, permissions: string[] = ['read', 'write'], expiresInDays?: number): string => {
  const key = `cn_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined;
  
  const apiKeyInfo: ApiKeyInfo = {
    key,
    userId,
    permissions,
    createdAt: new Date(),
    lastUsed: new Date(),
    expiresAt,
    isActive: true
  };
  
  apiKeyStore.set(key, apiKeyInfo);
  return key;
};

// Rotate API key
export const rotateApiKey = (oldKey: string, userId: string): { newKey: string; oldKey: string } | null => {
  const oldKeyInfo = apiKeyStore.get(oldKey);
  if (!oldKeyInfo || oldKeyInfo.userId !== userId || !oldKeyInfo.isActive) {
    return null;
  }
  
  // Generate new key with same permissions
  const newKey = generateApiKey(userId, oldKeyInfo.permissions, oldKeyInfo.expiresAt ? 
    Math.ceil((oldKeyInfo.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : undefined);
  
  // Deactivate old key
  oldKeyInfo.isActive = false;
  
  return { newKey, oldKey };
};

// Revoke API key
export const revokeApiKey = (key: string, userId: string): boolean => {
  const keyInfo = apiKeyStore.get(key);
  if (keyInfo && keyInfo.userId === userId) {
    keyInfo.isActive = false;
    return true;
  }
  return false;
};

// Get API key info
export const getApiKeyInfo = (key: string): ApiKeyInfo | null => {
  return apiKeyStore.get(key) || null;
};

// Rate limiting configuration
export const createRateLimit = (windowMs: number = 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs, // 1 minute by default to meet 100 requests/minute requirement
    max, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// User-specific rate limiting (100 requests/minute per user)
export const createUserRateLimit = (windowMs: number = 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs, // 1 minute
    max, // 100 requests per minute per user
    // Use user ID if authenticated; otherwise use library-provided IPv4/IPv6-safe IP key
    keyGenerator: (req: Request) => (req as any).user?.id || ipKeyGenerator(req.ip as string),
    message: {
      error: 'Too many requests from this user, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests from this user, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Development-friendly rate limiting configuration
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
const isRateLimitDisabled = process.env.SKIP_RATE_LIMIT === '1';

// Specific rate limits for different endpoints
export const authRateLimit = isRateLimitDisabled || isDevelopment 
  ? createRateLimit(1 * 60 * 1000, 1000) // Very permissive in dev
  : createRateLimit(5 * 60 * 1000, 20); // 20 attempts per 5 minutes for auth in production
export const apiRateLimit = createUserRateLimit(60 * 1000, 100); // 100 requests per minute per user for API
export const aiRateLimit = createUserRateLimit(60 * 1000, 20); // 20 AI requests per minute per user
export const websocketRateLimit = createRateLimit(60 * 1000, 10); // 10 WebSocket connections per minute

// CORS configuration
const devOrigins = [
  'http://localhost:5000', 
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
  'http://0.0.0.0:5000', // ✅ Docker internal routing
  'http://creator-ai-app:5000', // ✅ Docker container name
  'http://172.19.0.4:5000', // ✅ Docker container IP
  'http://172.18.0.4:5000', // ✅ Alternative Docker IP range
  'http://172.17.0.4:5000'  // ✅ Default Docker bridge IP range
];
const prodOrigins = ['https://creatornexus.com', 'https://www.creatornexus.com'] as const;
const maybeFrontend = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
export const corsOptions: CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ([...prodOrigins, ...maybeFrontend] as (string | RegExp | boolean)[])
    : (devOrigins as (string | RegExp | boolean)[]),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Session-Expiry-Warning', 'X-Session-Expiry-Time'],
  maxAge: 86400 // 24 hours
};

// Security headers configuration
export const helmetConfig: Readonly<HelmetOptions> = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://replit.com",
        "https://*.replit.com",
        "https://api.openai.com"
      ],
      scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://replit.com",
        "https://*.replit.com",
        "https://api.openai.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://replit.com", "https://api.openai.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false, // Disable HSTS in development
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      req.body = validatedData.body;
      req.query = validatedData.query;
      req.params = validatedData.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // User authentication schemas
  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters')
    })
  }),
  
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
      lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long')
    })
  }),
  
  // Content creation schemas
  createContent: z.object({
    body: z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
      description: z.string().max(1000, 'Description too long').optional(),
      platform: z.string().min(1, 'Platform is required'),
      contentType: z.string().min(1, 'Content type is required'),
      scheduledDate: z.string().datetime().optional()
    })
  }),
  
  // AI generation schemas
  aiGeneration: z.object({
    body: z.object({
      prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000, 'Prompt too long'),
      type: z.enum(['script', 'text', 'code', 'image']),
      options: z.record(z.any()).optional()
    })
  }),
  
  // Lightweight prompt schema for endpoints that only require a prompt
  aiPrompt: z.object({
    body: z.object({
      prompt: z.string().min(1, 'Prompt is required'),
      options: z.record(z.any()).optional(),
      systemInstruction: z.string().optional()
    })
  }),

  // Gemini specific schemas
  geminiStructured: z.object({
    body: z.object({
      prompt: z.string().min(1, 'Prompt is required'),
      schema: z.any(),
      systemInstruction: z.string().optional()
    })
  }),

  geminiCode: z.object({
    body: z.object({
      description: z.string().min(1, 'Description is required'),
      language: z.string().min(1, 'Language is required'),
      framework: z.string().optional()
    })
  }),

  analyzeDocument: z.object({
    body: z.object({
      text: z.string().min(1, 'Text is required'),
      analysisType: z.string().min(1, 'Analysis type is required')
    })
  }),

  searchGrounded: z.object({
    body: z.object({
      query: z.string().min(1, 'Query is required'),
      context: z.string().optional()
    })
  }),

  // Analytics schemas
  analyticsPredictPerformance: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required'),
      platform: z.string().min(1, 'Platform is required'),
      audience: z.string().min(1, 'Audience is required')
    })
  }),

  analyticsAnalyzeCompetitors: z.object({
    body: z.object({
      niche: z.string().min(1, 'Niche is required'),
      platform: z.string().min(1, 'Platform is required')
    })
  }),

  analyticsGenerateMonetization: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required'),
      audience: z.string().min(1, 'Audience is required'),
      platform: z.string().min(1, 'Platform is required')
    })
  }),

  analyticsAnalyzeTrends: z.object({
    body: z.object({
      niche: z.string().min(1, 'Niche is required'),
      timeframe: z.string().optional()
    })
  }),

  analyticsAnalyzeAudience: z.object({
    body: z.object({
      audienceData: z.any()
    })
  }),

  // AI script generation schema
  generateScript: z.object({
    body: z.object({
      topic: z.string().min(1, 'Topic is required'),
      platform: z.string().optional(),
      duration: z.string().optional()
    })
  }),
  
  // File upload schemas
  fileUpload: z.object({
    body: z.object({
      filename: z.string().min(1, 'Filename is required'),
      contentType: z.string().min(1, 'Content type is required'),
      size: z.number().positive('File size must be positive')
    })
  }),
  
  // Generic ID parameter schema
  idParam: z.object({
    params: z.object({
      id: z.string().min(1, 'ID is required')
    })
  }),
  
  // Pagination schema
  pagination: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  })
};

// SQL injection prevention middleware
export const sqlInjectionPrevention = (req: Request, res: Response, next: NextFunction) => {
  // Skip security checks for test routes
  if (req.path.startsWith('/api/test/')) {
    console.log('🔍 Test route detected, skipping SQL injection checks:', req.path);
    return next();
  }

  // Avoid flagging benign words like "script" that appear in normal prompts.
  const sqlPatterns = [
    /(\b(union(?:\s+all)?|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
    /(['"])\s*\w+\s*\1\s*=\s*\1\s*\w+\s*\1/i,
    /(--)|\/\*|\*\/|xp_|sp_|;/i
  ];

  // AI prompt endpoints accept natural language which may include SQL keywords innocently
  const isAIPromptEndpoint = req.path.startsWith('/api/ai') || req.path.startsWith('/api/gemini');
  
  // Project creation endpoints may contain legitimate content that could trigger false positives
  const isProjectEndpoint = req.path === '/api/projects' && req.method === 'POST';

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      // For project creation, be more lenient and only check for obvious SQL injection patterns
      if (isProjectEndpoint) {
        // Only check for the most obvious SQL injection patterns
        const strictPatterns = [
          /(--)|\/\*|\*\/|;/i,  // Comments and semicolons
          /(\b(union(?:\s+all)?)\b)/i,  // UNION statements
          /(\b(drop|create|alter)\b)/i,  // DDL statements
          /xp_|sp_/i  // Extended stored procedures
        ];
        return strictPatterns.some(pattern => pattern.test(value));
      }
      
      // For AI endpoints, use minimal patterns
      if (isAIPromptEndpoint) {
        const patterns = [/((--)|\/\*|\*\/|;)/];
        return patterns.some(pattern => pattern.test(value));
      }
      
      // For other endpoints, use standard patterns
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  const hasSqlInjection = checkValue(req.body) || checkValue(req.query) || checkValue(req.params);

  if (hasSqlInjection) {
    console.warn('SQL injection prevention triggered:', {
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    return res.status(400).json({
      error: 'Invalid input detected',
      message: 'Potentially malicious input detected'
    });
  }

  next();
};

// XSS prevention middleware
export const xssPrevention = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ];

  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      let sanitized = value;
      xssPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });
      return sanitized;
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      userId: (req as any).user?.id || 'anonymous'
    };

    // Log based on status code
    if (res.statusCode >= 400) {
      console.error('Request Error:', logData);
    } else {
      console.log('Request:', logData);
    }
  });

  next();
};

// Error handling middleware with security headers
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Set security headers on all error responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  if (err.name === 'RateLimitExceeded') {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil((err.resetTime - Date.now()) / 1000),
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  // Handle API key specific errors
  if (err.name === 'ApiKeyError') {
    return res.status(401).json({
      error: 'API Key Error',
      message: err.message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: 'Server Error',
    message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
    ...(process.env.NODE_ENV === 'production' && { 
      code: 'INTERNAL_ERROR',
      support: process.env.SUPPORT_EMAIL || 'support@creatorai.com'
    }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Session timeout warning middleware
export const sessionTimeoutWarning = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    // Check if token is about to expire (within 1 hour)
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          const timeUntilExpiry = decoded.exp * 1000 - Date.now();
          const oneHour = 60 * 60 * 1000;
          
          if (timeUntilExpiry < oneHour && timeUntilExpiry > 0) {
            res.setHeader('X-Session-Expiry-Warning', 'true');
            res.setHeader('X-Session-Expiry-Time', Math.floor(timeUntilExpiry / 1000));
          }
        }
      } catch (error) {
        // Ignore token decode errors
      }
    }
  }
  next();
};

// Enhanced API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API Key Required',
      message: 'Valid API key is required for this endpoint'
    });
  }

  // Validate API key format (basic validation)
  if (typeof apiKey !== 'string' || apiKey.length < 32) {
    return res.status(401).json({
      error: 'Invalid API Key',
      message: 'API key format is invalid'
    });
  }

  // Check if API key exists and is active
  const keyInfo = getApiKeyInfo(apiKey);
  if (!keyInfo || !keyInfo.isActive) {
    return res.status(401).json({
      error: 'Invalid API Key',
      message: 'API key is invalid or has been revoked'
    });
  }

  // Check if API key has expired
  if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
    return res.status(401).json({
      error: 'API Key Expired',
      message: 'API key has expired'
    });
  }

  // Update last used timestamp
  keyInfo.lastUsed = new Date();
  
  // Add key info to request for permission checking
  (req as any).apiKeyInfo = keyInfo;
  
  next();
};

// Permission-based API key validation
export const requireApiKeyPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const keyInfo = (req as any).apiKeyInfo;
    
    if (!keyInfo) {
      return res.status(401).json({
        error: 'API Key Required',
        message: 'Valid API key is required for this endpoint'
      });
    }

    if (!keyInfo.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: `API key does not have required permission: ${requiredPermission}`
      });
    }

    next();
  };
};

// Content type validation middleware
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type Required',
        message: 'Content-Type header is required'
      });
    }

    const isValidType = allowedTypes.some(type => 
      contentType.includes(type)
    );

    if (!isValidType) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// File size limit middleware
export const fileSizeLimit = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `File size exceeds maximum limit of ${maxSize} bytes`
      });
    }

    next();
  };
};

// Security audit logging middleware
export const securityAuditLog = (req: Request, res: Response, next: NextFunction) => {
  const securityEvents = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous',
    apiKeyId: (req as any).apiKeyInfo?.key ? 'present' : 'none',
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      contentType: req.get('Content-Type')
    }
  };

  // Log suspicious activities
  const suspiciousPatterns = [
    /(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/i,
    /(javascript:|vbscript:|onload|onerror)/i,
    /(<script|<iframe|<object|<embed)/i
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || 
    pattern.test(JSON.stringify(req.body)) || 
    pattern.test(JSON.stringify(req.query))
  );

  if (hasSuspiciousContent) {
    console.warn('Suspicious activity detected:', securityEvents);
  }

  next();
};

// Enhanced security monitoring and alerting
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private threatLevel = 0;
  private suspiciousActivities: Array<{
    timestamp: Date;
    ip: string;
    activity: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
  }> = [];
  private blockedIPs = new Set<string>();
  private rateLimitViolations = new Map<string, number>();

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  recordSuspiciousActivity(ip: string, activity: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) {
    const event = {
      timestamp: new Date(),
      ip,
      activity,
      severity,
      details
    };

    this.suspiciousActivities.push(event);
    
    // Update threat level
    switch (severity) {
      case 'low': this.threatLevel += 1; break;
      case 'medium': this.threatLevel += 3; break;
      case 'high': this.threatLevel += 5; break;
      case 'critical': this.threatLevel += 10; break;
    }

    // Log and potentially block IPs
    if (severity === 'high' || severity === 'critical') {
      console.error('🚨 HIGH SECURITY THREAT DETECTED:', event);
      
      // Block IP after multiple high-severity violations
      const violations = this.rateLimitViolations.get(ip) || 0;
      if (violations >= 3) {
        this.blockedIPs.add(ip);
        console.error(`🚫 IP ${ip} has been blocked due to multiple security violations`);
      }
    }

    // Clean up old events (keep last 1000)
    if (this.suspiciousActivities.length > 1000) {
      this.suspiciousActivities = this.suspiciousActivities.slice(-1000);
    }
  }

  recordRateLimitViolation(ip: string) {
    const violations = this.rateLimitViolations.get(ip) || 0;
    this.rateLimitViolations.set(ip, violations + 1);
    
    if (violations >= 5) {
      this.recordSuspiciousActivity(ip, 'Excessive rate limit violations', 'high', { violations });
    }
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  getThreatLevel(): number {
    return this.threatLevel;
  }

  getSecurityReport() {
    return {
      threatLevel: this.threatLevel,
      blockedIPs: Array.from(this.blockedIPs),
      recentSuspiciousActivities: this.suspiciousActivities.slice(-10),
      rateLimitViolations: Object.fromEntries(this.rateLimitViolations)
    };
  }

  resetThreatLevel() {
    this.threatLevel = Math.max(0, this.threatLevel - 1);
  }
}

// Enhanced security audit logging with monitoring
export const enhancedSecurityAuditLog = (req: Request, res: Response, next: NextFunction) => {
  // Skip security checks for test routes
  if (req.path.startsWith('/api/test/')) {
    console.log('🔍 Test route detected, skipping security checks:', req.path);
    return next();
  }

  const monitor = SecurityMonitor.getInstance();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // Debug logging for all requests
  console.log('🔍 Enhanced security audit - Request details:', {
    path: req.path,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // Check if IP is blocked
  if (monitor.isIPBlocked(ip)) {
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Your IP address has been blocked due to security violations'
    });
  }

  const securityEvents = {
    timestamp: new Date().toISOString(),
    ip,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous',
    apiKeyId: (req as any).apiKeyInfo?.key ? 'present' : 'none',
    headers: {
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      contentType: req.get('Content-Type')
    }
  };

  // Check if this is a project creation endpoint (be more lenient)
  const isProjectEndpoint = req.path === '/api/projects' && req.method === 'POST';
  const isAIPromptEndpoint = req.path.startsWith('/api/ai') || req.path.startsWith('/api/gemini');

  // Enhanced suspicious activity detection with context awareness
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
    /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i,
    /(--|\/\*|\*\/|xp_|sp_)/i,
    
    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    
    // Path traversal
    /\.\.\//,
    /\.\.\\/,
    
    // Command injection
    /(\b(cmd|command|exec|system|eval|Function)\b)/i,
    
    // Suspicious headers
    /(x-forwarded-for|x-real-ip|x-forwarded-proto)/i
  ];

  // For project endpoints, use more lenient patterns
  const projectPatterns = [
    /(--|\/\*|\*\/|;)/i,  // Only check for comments and semicolons
    /(\b(union(?:\s+all)?)\b)/i,     // Only check for UNION statements
    /xp_|sp_/i            // Extended stored procedures
  ];

  // For AI endpoints, use minimal patterns
  const aiPatterns = [
    /(--|\/\*|\*\/|;)/i   // Only check for comments
  ];

  let hasSuspiciousContent = false;
  let patternMatched = '';

  if (isProjectEndpoint) {
    console.log('🔍 Project endpoint detected, using lenient patterns');
    console.log('🔍 Project description:', req.body?.description);
    console.log('🔍 Project description length:', req.body?.description?.length || 0);
    
    hasSuspiciousContent = projectPatterns.some(pattern => {
      const matched = pattern.test(req.url) || 
                     (req.body && pattern.test(JSON.stringify(req.body))) || 
                     (req.query && pattern.test(JSON.stringify(req.query)));
      if (matched) {
        patternMatched = pattern.source;
        console.log('⚠️ Project endpoint - pattern matched:', pattern.source);
        console.log('⚠️ Matched content:', req.body);
      }
      return matched;
    });
  } else if (isAIPromptEndpoint) {
    console.log('🔍 AI endpoint detected, using minimal patterns');
    hasSuspiciousContent = aiPatterns.some(pattern => {
      const matched = pattern.test(req.url) || 
                     (req.body && pattern.test(JSON.stringify(req.body))) || 
                     (req.query && pattern.test(JSON.stringify(req.query)));
      if (matched) {
        patternMatched = pattern.source;
        console.log('⚠️ AI endpoint - pattern matched:', pattern.source);
      }
      return matched;
    });
  } else {
    console.log('🔍 Standard endpoint, using full patterns');
    hasSuspiciousContent = suspiciousPatterns.some(pattern => {
      const matched = pattern.test(req.url) || 
                     (req.body && pattern.test(JSON.stringify(req.body))) || 
                     (req.query && pattern.test(JSON.stringify(req.query)));
      if (matched) {
        patternMatched = pattern.source;
        console.log('⚠️ Standard endpoint - pattern matched:', pattern.source);
      }
      return matched;
    });
  }

  if (hasSuspiciousContent) {
    const severity = req.method === 'POST' || req.method === 'PUT' ? 'high' : 'medium';
    monitor.recordSuspiciousActivity(ip, `Suspicious content detected: ${patternMatched}`, severity, securityEvents);
    console.warn('🚨 Suspicious activity detected:', {
      ...securityEvents,
      patternMatched,
      endpoint: isProjectEndpoint ? 'project' : isAIPromptEndpoint ? 'ai' : 'standard'
    });
  }

  // Monitor for unusual request patterns
  if (req.url.includes('admin') || req.url.includes('config') || req.url.includes('system')) {
    if (!(req as any).user) {
      monitor.recordSuspiciousActivity(ip, 'Unauthorized access attempt to sensitive endpoint', 'high', securityEvents);
    }
  }

  console.log('✅ Enhanced security audit passed for:', req.path);
  next();
}; 

// Request ID middleware for better tracking
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || nanoid();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}; 