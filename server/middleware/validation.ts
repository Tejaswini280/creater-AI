import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Content validation schemas
export const contentValidationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  script: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  contentType: z.enum(['video', 'image', 'text', 'reel', 'short'], 'Invalid content type').transform(val => val.toLowerCase()),
  scheduledAt: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return date > new Date();
  }, 'Scheduled time must be in the future'),
  tags: z.array(z.string()).max(50, 'Maximum 50 tags allowed').optional(),
  projectId: z.number().optional(),
  status: z.string().optional(),
});

// Social post validation schemas
export const socialPostValidationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  caption: z.string().max(3000, 'Caption must be less than 3000 characters').optional(),
  hashtags: z.array(z.string()).max(30, 'Maximum 30 hashtags allowed').optional(),
  emojis: z.array(z.string()).max(20, 'Maximum 20 emojis allowed').optional(),
  contentType: z.enum(['post', 'reel', 'short', 'story', 'video'], 'Invalid content type'),
  scheduledAt: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return date > new Date();
  }, 'Scheduled time must be in the future'),
});

// AI generation validation schemas
export const aiGenerationValidationSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000, 'Prompt must be less than 2000 characters'),
  taskType: z.enum(['script', 'voiceover', 'video', 'thumbnail'], 'Invalid task type'),
});

// Scheduling validation schemas
export const schedulingValidationSchema = z.object({
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'weekdays']).default('none'),
  timezone: z.string().min(3, 'Timezone must be at least 3 characters').default('UTC'),
  seriesEndDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return date > new Date();
  }, 'Series end date must be in the future'),
});

// Project validation schemas
export const projectValidationSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  type: z.enum(['video', 'audio', 'image', 'script', 'campaign', 'social-media'], 'Invalid project type'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed').optional(),
  platform: z.string().optional(),
  targetAudience: z.string().max(500, 'Target audience description too long').optional(),
  estimatedDuration: z.string().optional(),
  isPublic: z.boolean().optional(),
  template: z.string().optional(),
  metadata: z.object({}).optional(),
  // Additional fields for social media projects
  contentType: z.array(z.string()).optional(),
  channelTypes: z.array(z.string()).optional(),
  category: z.string().optional(),
  duration: z.string().optional(),
  contentFrequency: z.string().optional(),
  aiEnhancement: z.any().optional(),
}).passthrough(); // Allow additional fields

// File upload validation schemas
export const fileUploadValidationSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  fileSize: z.number().max(100 * 1024 * 1024, 'File size must be less than 100MB'), // 100MB limit
  mimeType: z.string().refine((val) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov',
      'audio/mp3', 'audio/wav', 'audio/m4a',
      'application/pdf', 'text/plain'
    ];
    return allowedTypes.includes(val);
  }, 'File type not allowed'),
});

// Validation middleware function
export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }
  };
}

// Cross-field validation middleware
export function validateCrossField(req: Request, res: Response, next: NextFunction) {
  const { scheduledAt, publishedAt, status } = req.body;

  // If status is 'published', publishedAt should be set
  if (status === 'published' && !publishedAt) {
    return res.status(400).json({
      success: false,
      message: 'Published content must have a published date'
    });
  }

  // If publishedAt is set, status should be 'published'
  if (publishedAt && status !== 'published') {
    return res.status(400).json({
      success: false,
      message: 'Content with published date must have published status'
    });
  }

  // Scheduled time should be reasonable (not too far in the future)
  if (scheduledAt) {
    const scheduledDate = new Date(scheduledAt);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (scheduledDate > oneYearFromNow) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time cannot be more than 1 year in the future'
      });
    }
  }

  next();
}

// Business rule validation middleware
export function validateBusinessRules(req: Request, res: Response, next: NextFunction) {
  const { platform, contentType } = req.body;

  // Platform-specific content type validation
  const platformContentTypes: Record<string, string[]> = {
    youtube: ['video', 'short'],
    instagram: ['image', 'video', 'reel', 'story'],
    facebook: ['post', 'video', 'image'],
    linkedin: ['post', 'video'],
    tiktok: ['video']
  };

  if (platform && contentType) {
    const allowedTypes = platformContentTypes[platform.toLowerCase()];
    if (allowedTypes && !allowedTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: `Content type '${contentType}' is not supported on ${platform}`
      });
    }
  }

  next();
}

// Enhanced sanitization middleware with security
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove HTML tags and potential XSS vectors
  const sanitizeHtml = (text: string) => {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .trim();
  };

  // Validate and sanitize string fields
  const sanitizeString = (text: string, maxLength?: number) => {
    if (typeof text !== 'string') return text;

    let sanitized = sanitizeHtml(text).trim();

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b(script|javascript|vbscript|onload|onerror|onclick)\b/gi,
      /<[^>]*>/g,
      /javascript:[^"']*/gi,
      /data:[^"']*/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        throw new Error('Potentially malicious input detected');
      }
    }

    // Apply length limit if specified
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  };

  // Apply sanitization to relevant fields
  const fieldsToSanitize = ['title', 'description', 'caption', 'script', 'name', 'prompt'];
  fieldsToSanitize.forEach(field => {
    if (req.body[field]) {
      try {
        req.body[field] = sanitizeString(req.body[field]);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Invalid input detected'
        });
      }
    }
  });

  // Sanitize array fields
  const arrayFieldsToSanitize = ['tags', 'hashtags', 'emojis'];
  arrayFieldsToSanitize.forEach(field => {
    if (Array.isArray(req.body[field])) {
      req.body[field] = req.body[field]
        .filter(item => typeof item === 'string')
        .map(item => sanitizeString(item, 100))
        .filter(item => item.length > 0);
    }
  });

  // Trim whitespace from all string fields
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  next();
}

// Input size validation middleware
export function validateInputSize(req: Request, res: Response, next: NextFunction) {
  const maxPayloadSize = 10 * 1024 * 1024; // 10MB limit for JSON payloads
  const contentLength = parseInt(req.headers['content-length'] || '0');

  if (contentLength > maxPayloadSize) {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large'
    });
  }

  // Validate JSON structure depth (prevent deep nesting attacks)
  const validateObjectDepth = (obj: any, maxDepth = 10, currentDepth = 0): boolean => {
    if (currentDepth > maxDepth) return false;

    if (Array.isArray(obj)) {
      return obj.every(item => validateObjectDepth(item, maxDepth, currentDepth + 1));
    } else if (obj && typeof obj === 'object') {
      return Object.values(obj).every(value =>
        validateObjectDepth(value, maxDepth, currentDepth + 1)
      );
    }
    return true;
  };

  if (!validateObjectDepth(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Request structure too complex'
    });
  }

  next();
}

// Rate limiting helper (to be used with express-rate-limit)
export function createRateLimitOptions(windowMs: number, maxRequests: number) {
  return {
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  };
}

// Export validation schemas for reuse
export const validationSchemas = {
  content: contentValidationSchema,
  socialPost: socialPostValidationSchema,
  aiGeneration: aiGenerationValidationSchema,
  scheduling: schedulingValidationSchema,
  project: projectValidationSchema,
  fileUpload: fileUploadValidationSchema,
};
