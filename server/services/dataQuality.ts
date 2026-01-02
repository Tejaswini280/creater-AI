import { z } from 'zod';
import { db } from '../db';
import { users, content, templates, notifications, aiGenerationTasks, niches, socialAccounts } from '../../shared/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Enhanced validation schemas with comprehensive rules
export const userValidationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  profileImageUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

export const contentValidationSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Title contains invalid characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  platform: z.enum(['youtube', 'instagram', 'facebook', 'tiktok', 'linkedin'], {
    errorMap: () => ({ message: 'Platform must be one of: youtube, instagram, facebook, tiktok, linkedin' })
  }),
  contentType: z.enum(['video', 'image', 'text', 'reel', 'short'], {
    errorMap: () => ({ message: 'Content type must be one of: video, image, text, reel, short' })
  }),
  status: z.enum(['draft', 'scheduled', 'published', 'failed'], {
    errorMap: () => ({ message: 'Status must be one of: draft, scheduled, published, failed' })
  }).default('draft'),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  scheduledAt: z.date().optional(),
  publishedAt: z.date().optional(),
});

export const templateValidationSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  category: z.enum(['video', 'thumbnail', 'script', 'branding', 'social'], {
    errorMap: () => ({ message: 'Category must be one of: video, thumbnail, script, branding, social' })
  }),
  type: z.string()
    .min(1, 'Type is required')
    .max(50, 'Type must be less than 50 characters'),
  content: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  downloads: z.number().min(0).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
});

export const nicheValidationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be one of: easy, medium, hard' })
  }),
  profitability: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Profitability must be one of: low, medium, high' })
  }),
  keywords: z.array(z.string().min(1).max(50)).max(20, 'Maximum 20 keywords allowed').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

// Data sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\s+/g, ' '); // Normalize whitespace
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeTags = (tags: string[]): string[] => {
  return tags
    .map(tag => sanitizeString(tag))
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10); // Limit to 10 tags
};

// Data quality monitoring
export interface DataQualityMetrics {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  qualityScore: number;
  issues: DataQualityIssue[];
}

export interface DataQualityIssue {
  table: string;
  recordId: string | number;
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export class DataQualityMonitor {
  private static instance: DataQualityMonitor;
  private issues: DataQualityIssue[] = [];
  private metrics: Map<string, DataQualityMetrics> = new Map();

  static getInstance(): DataQualityMonitor {
    if (!DataQualityMonitor.instance) {
      DataQualityMonitor.instance = new DataQualityMonitor();
    }
    return DataQualityMonitor.instance;
  }

  async validateUserData(): Promise<DataQualityMetrics> {
    const allUsers = await db.select().from(users);
    const issues: DataQualityIssue[] = [];
    let validRecords = 0;

    for (const user of allUsers) {
      try {
        userValidationSchema.parse({
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        });
        validRecords++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            issues.push({
              table: 'users',
              recordId: user.id,
              field: err.path.join('.'),
              issue: err.message,
              severity: 'high',
              timestamp: new Date()
            });
          });
        }
      }
    }

    const metrics: DataQualityMetrics = {
      totalRecords: allUsers.length,
      validRecords,
      invalidRecords: allUsers.length - validRecords,
      qualityScore: allUsers.length > 0 ? (validRecords / allUsers.length) * 100 : 100,
      issues
    };

    this.metrics.set('users', metrics);
    this.issues.push(...issues);
    return metrics;
  }

  async validateContentData(): Promise<DataQualityMetrics> {
    const allContent = await db.select().from(content);
    const issues: DataQualityIssue[] = [];
    let validRecords = 0;

    for (const contentItem of allContent) {
      try {
        contentValidationSchema.parse({
          title: contentItem.title,
          description: contentItem.description,
          platform: contentItem.platform,
          contentType: contentItem.contentType,
          status: contentItem.status,
          tags: contentItem.tags,
          scheduledAt: contentItem.scheduledAt,
          publishedAt: contentItem.publishedAt
        });
        validRecords++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            issues.push({
              table: 'content',
              recordId: contentItem.id,
              field: err.path.join('.'),
              issue: err.message,
              severity: 'medium',
              timestamp: new Date()
            });
          });
        }
      }
    }

    const metrics: DataQualityMetrics = {
      totalRecords: allContent.length,
      validRecords,
      invalidRecords: allContent.length - validRecords,
      qualityScore: allContent.length > 0 ? (validRecords / allContent.length) * 100 : 100,
      issues
    };

    this.metrics.set('content', metrics);
    this.issues.push(...issues);
    return metrics;
  }

  async validateTemplateData(): Promise<DataQualityMetrics> {
    const allTemplates = await db.select().from(templates);
    const issues: DataQualityIssue[] = [];
    let validRecords = 0;

    for (const template of allTemplates) {
      try {
        templateValidationSchema.parse({
          title: template.title,
          description: template.description,
          category: template.category,
          type: template.type,
          content: template.content,
          rating: template.rating ? Number(template.rating) : undefined,
          downloads: template.downloads,
          tags: template.tags
        });
        validRecords++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            issues.push({
              table: 'templates',
              recordId: template.id,
              field: err.path.join('.'),
              issue: err.message,
              severity: 'medium',
              timestamp: new Date()
            });
          });
        }
      }
    }

    const metrics: DataQualityMetrics = {
      totalRecords: allTemplates.length,
      validRecords,
      invalidRecords: allTemplates.length - validRecords,
      qualityScore: allTemplates.length > 0 ? (validRecords / allTemplates.length) * 100 : 100,
      issues
    };

    this.metrics.set('templates', metrics);
    this.issues.push(...issues);
    return metrics;
  }

  async validateNicheData(): Promise<DataQualityMetrics> {
    const allNiches = await db.select().from(niches);
    const issues: DataQualityIssue[] = [];
    let validRecords = 0;

    for (const niche of allNiches) {
      try {
        nicheValidationSchema.parse({
          name: niche.name,
          category: niche.category,
          difficulty: niche.difficulty,
          profitability: niche.profitability,
          keywords: niche.keywords,
          description: niche.description
        });
        validRecords++;
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            issues.push({
              table: 'niches',
              recordId: niche.id,
              field: err.path.join('.'),
              issue: err.message,
              severity: 'medium',
              timestamp: new Date()
            });
          });
        }
      }
    }

    const metrics: DataQualityMetrics = {
      totalRecords: allNiches.length,
      validRecords,
      invalidRecords: allNiches.length - validRecords,
      qualityScore: allNiches.length > 0 ? (validRecords / allNiches.length) * 100 : 100,
      issues
    };

    this.metrics.set('niches', metrics);
    this.issues.push(...issues);
    return metrics;
  }

  async validateAllData(): Promise<Map<string, DataQualityMetrics>> {
    await Promise.all([
      this.validateUserData(),
      this.validateContentData(),
      this.validateTemplateData(),
      this.validateNicheData()
    ]);

    return this.metrics;
  }

  getIssues(): DataQualityIssue[] {
    return this.issues;
  }

  getMetrics(): Map<string, DataQualityMetrics> {
    return this.metrics;
  }

  clearIssues(): void {
    this.issues = [];
  }
}

// Data backup and recovery
export class DataBackupManager {
  private static backupDir = path.join(process.cwd(), 'backups');

  static async createBackup(): Promise<string> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        users: await db.select().from(users),
        content: await db.select().from(content),
        templates: await db.select().from(templates),
        niches: await db.select().from(niches),
        notifications: await db.select().from(notifications),
        aiGenerationTasks: await db.select().from(aiGenerationTasks),
        socialAccounts: await db.select().from(socialAccounts)
      };

      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      
      console.log(`Backup created: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  static async restoreBackup(backupFile: string): Promise<void> {
    try {
      const backupData = JSON.parse(await fs.readFile(backupFile, 'utf-8'));
      
      // Clear existing data
      await db.delete(users);
      await db.delete(content);
      await db.delete(templates);
      await db.delete(niches);
      await db.delete(notifications);
      await db.delete(aiGenerationTasks);
      await db.delete(socialAccounts);
      
      // Restore data
      if (backupData.users) {
        for (const user of backupData.users) {
          await db.insert(users).values(user);
        }
      }
      
      if (backupData.content) {
        for (const contentItem of backupData.content) {
          await db.insert(content).values(contentItem);
        }
      }
      
      if (backupData.templates) {
        for (const template of backupData.templates) {
          await db.insert(templates).values(template);
        }
      }
      
      if (backupData.niches) {
        for (const niche of backupData.niches) {
          await db.insert(niches).values(niche);
        }
      }
      
      if (backupData.notifications) {
        for (const notification of backupData.notifications) {
          await db.insert(notifications).values(notification);
        }
      }
      
      if (backupData.aiGenerationTasks) {
        for (const task of backupData.aiGenerationTasks) {
          await db.insert(aiGenerationTasks).values(task);
        }
      }
      
      if (backupData.socialAccounts) {
        for (const account of backupData.socialAccounts) {
          await db.insert(socialAccounts).values(account);
        }
      }
      
      console.log(`Backup restored from: ${backupFile}`);
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw new Error('Failed to restore backup');
    }
  }

  static async listBackups(): Promise<string[]> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      const files = await fs.readdir(this.backupDir);
      return files.filter(file => file.endsWith('.json')).map(file => path.join(this.backupDir, file));
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }
}

// Data audit trails
export interface AuditLog {
  id: string;
  table: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  recordId: string | number;
  userId: string;
  oldData?: any;
  newData?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  private static logs: AuditLog[] = [];

  static log(action: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const log: AuditLog = {
      ...action,
      id: createHash('md5').update(`${action.table}-${action.recordId}-${Date.now()}`).digest('hex'),
      timestamp: new Date()
    };
    
    this.logs.push(log);
    console.log('Audit Log:', log);
  }

  static getLogs(filters?: Partial<AuditLog>): AuditLog[] {
    return this.logs.filter(log => {
      if (filters?.table && log.table !== filters.table) return false;
      if (filters?.action && log.action !== filters.action) return false;
      if (filters?.userId && log.userId !== filters.userId) return false;
      return true;
    });
  }

  static clearLogs(): void {
    this.logs = [];
  }
}

// Data retention and cleanup
export class DataRetentionManager {
  static async cleanupOldData(): Promise<{ deleted: number; errors: number }> {
    let deleted = 0;
    let errors = 0;
    
    try {
      // Clean up old notifications (older than 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const deletedNotifications = await db.delete(notifications)
        .where(lte(notifications.createdAt, ninetyDaysAgo));
      deleted += 1;
      
      // Clean up failed AI tasks (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deletedTasks = await db.delete(aiGenerationTasks)
        .where(and(
          eq(aiGenerationTasks.status, 'failed'),
          lte(aiGenerationTasks.createdAt, thirtyDaysAgo)
        ));
      deleted += 1;
      
    } catch (error) {
      console.error('Data cleanup error:', error);
      errors++;
    }
    
    return { deleted, errors };
  }
}

// Data export and import
export class DataExportManager {
  static async exportData(table: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      let data: any[] = [];
      
      switch (table) {
        case 'users':
          data = await db.select().from(users);
          break;
        case 'content':
          data = await db.select().from(content);
          break;
        case 'templates':
          data = await db.select().from(templates);
          break;
        case 'niches':
          data = await db.select().from(niches);
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }
      
      if (format === 'csv') {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
            }).join(',')
          )
        ];
        
        return csvRows.join('\n');
      } else {
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error(`Failed to export ${table} data`);
    }
  }

  static async importData(table: string, data: any[], format: 'json' | 'csv' = 'json'): Promise<number> {
    try {
      let processedData = data;
      
      if (format === 'csv' && Array.isArray(data)) {
        // Convert CSV data to objects
        const headers = data[0];
        processedData = data.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index];
          });
          return obj;
        });
      }
      
      let inserted = 0;
      
      switch (table) {
        case 'users':
          for (const user of processedData) {
            await db.insert(users).values(user);
            inserted++;
          }
          break;
        case 'content':
          for (const contentItem of processedData) {
            await db.insert(content).values(contentItem);
            inserted++;
          }
          break;
        case 'templates':
          for (const template of processedData) {
            await db.insert(templates).values(template);
            inserted++;
          }
          break;
        case 'niches':
          for (const niche of processedData) {
            await db.insert(niches).values(niche);
            inserted++;
          }
          break;
        default:
          throw new Error(`Unknown table: ${table}`);
      }
      
      return inserted;
    } catch (error) {
      console.error('Data import failed:', error);
      throw new Error(`Failed to import ${table} data`);
    }
  }
}

// Data migration and versioning
export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export class MigrationManager {
  private static migrations: Migration[] = [];
  private static currentVersion = 0;

  static registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  static async migrate(targetVersion?: number): Promise<void> {
    const target = targetVersion ?? Math.max(...this.migrations.map(m => m.version));
    
    if (target > this.currentVersion) {
      // Migrate up
      for (const migration of this.migrations) {
        if (migration.version > this.currentVersion && migration.version <= target) {
          console.log(`Running migration: ${migration.name} (v${migration.version})`);
          await migration.up();
          this.currentVersion = migration.version;
        }
      }
    } else if (target < this.currentVersion) {
      // Migrate down
      for (const migration of this.migrations.slice().reverse()) {
        if (migration.version <= this.currentVersion && migration.version > target) {
          console.log(`Rolling back migration: ${migration.name} (v${migration.version})`);
          await migration.down();
          this.currentVersion = migration.version;
        }
      }
    }
  }

  static getCurrentVersion(): number {
    return this.currentVersion;
  }

  static getMigrations(): Migration[] {
    return this.migrations;
  }
}


