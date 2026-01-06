import { db } from '../db';
import { sql } from 'drizzle-orm';
import { log } from '../utils/logger';

// Database performance monitoring
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();
  private slowQueryThreshold = 1000; // 1 second

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  // Monitor query performance
  async monitorQuery(queryName: string, queryFn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      this.updateQueryStats(queryName, executionTime);
      
      if (executionTime > this.slowQueryThreshold) {
        log(`Slow query detected: ${queryName} took ${executionTime}ms`);
      }
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      log(`Query error: ${queryName} failed after ${executionTime}ms - ${error}`);
      throw error;
    }
  }

  private updateQueryStats(queryName: string, executionTime: number): void {
    const stats = this.queryStats.get(queryName) || { count: 0, totalTime: 0, avgTime: 0 };
    
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    
    this.queryStats.set(queryName, stats);
  }

  // Get query performance statistics
  getQueryStats(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.queryStats);
  }

  // Get slow queries
  getSlowQueries(): Array<{ query: string; avgTime: number; count: number }> {
    return Array.from(this.queryStats.entries())
      .filter(([_, stats]) => stats.avgTime > this.slowQueryThreshold)
      .map(([query, stats]) => ({
        query,
        avgTime: stats.avgTime,
        count: stats.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime);
  }

  // Reset statistics
  resetStats(): void {
    this.queryStats.clear();
  }
}

// Database optimization utilities
export class DatabaseOptimizer {
  // Create database indexes for better performance
  static async createIndexes(): Promise<void> {
    try {
      // Users table indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      `);

      // Social accounts table indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON social_accounts(user_id);
        CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
        CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);
      `);

      // Content table indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
        CREATE INDEX IF NOT EXISTS idx_content_platform ON content(platform);
        CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
        CREATE INDEX IF NOT EXISTS idx_content_scheduled_at ON content(scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
        CREATE INDEX IF NOT EXISTS idx_content_user_status ON content(user_id, status);
      `);

      // Content metrics table indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
        CREATE INDEX IF NOT EXISTS idx_content_metrics_platform ON content_metrics(platform);
        CREATE INDEX IF NOT EXISTS idx_content_metrics_last_updated ON content_metrics(last_updated);
      `);

      // AI generation tasks table indexes
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_id ON ai_generation_tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_generation_tasks(task_type);
        CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_generation_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_ai_tasks_created_at ON ai_generation_tasks(created_at);
        CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_status ON ai_generation_tasks(user_id, status);
      `);

      log('Database indexes created successfully');
    } catch (error) {
      log(`Error creating database indexes: ${error}`);
      log('DB index creation skipped or failed (non-fatal): ' + error.message);
      // Don't throw error - make it non-fatal
    }
  }

  // Analyze table performance
  static async analyzeTables(): Promise<Record<string, any>> {
    try {
      const tables = ['users', 'social_accounts', 'content', 'content_metrics', 'ai_generation_tasks', 'niches'];
      const analysis: Record<string, any> = {};

      for (const table of tables) {
        const result = await db.execute(sql`
          SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation,
            most_common_vals,
            most_common_freqs
          FROM pg_stats 
          WHERE tablename = ${table}
          ORDER BY n_distinct DESC
        `);

        analysis[table] = result;
      }

      return analysis;
    } catch (error) {
      log(`Error analyzing tables: ${error}`);
      throw error;
    }
  }

  // Get table sizes
  static async getTableSizes(): Promise<Record<string, { size: string; rows: number }>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          (SELECT reltuples FROM pg_class WHERE relname = tablename) as rows
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      const sizes: Record<string, { size: string; rows: number }> = {};
      result.forEach((row: any) => {
        sizes[row.tablename] = {
          size: row.size,
          rows: parseInt(row.rows) || 0
        };
      });

      return sizes;
    } catch (error) {
      log(`Error getting table sizes: ${error}`);
      throw error;
    }
  }

  // Vacuum and analyze tables
  static async vacuumAndAnalyze(): Promise<void> {
    try {
      await db.execute(sql`VACUUM ANALYZE`);
      log('Database vacuum and analyze completed');
    } catch (error) {
      log(`Error during vacuum and analyze: ${error}`);
      throw error;
    }
  }

  // Check for long-running queries
  static async getLongRunningQueries(): Promise<Array<{ pid: number; query: string; duration: string }>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          pid,
          query,
          age(clock_timestamp(), query_start) as duration
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query NOT LIKE '%pg_stat_activity%'
        AND age(clock_timestamp(), query_start) > interval '5 seconds'
        ORDER BY query_start
      `);

      return result.map((row: any) => ({
        pid: row.pid,
        query: row.query,
        duration: row.duration
      }));
    } catch (error) {
      log(`Error getting long-running queries: ${error}`);
      throw error;
    }
  }

  // Kill long-running queries
  static async killQuery(pid: number): Promise<void> {
    try {
      await db.execute(sql`SELECT pg_terminate_backend(${pid})`);
      log(`Killed query with PID: ${pid}`);
    } catch (error) {
      log(`Error killing query: ${error}`);
      throw error;
    }
  }

  // Get connection pool statistics
  static async getConnectionStats(): Promise<Record<string, number>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return result[0] || {};
    } catch (error) {
      log(`Error getting connection stats: ${error}`);
      throw error;
    }
  }

  // Optimize specific queries
  static async optimizeSlowQueries(): Promise<void> {
    try {
      // Add specific optimizations for common slow queries
      
      // Optimize content queries with user filtering
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_content_user_created_status 
        ON content(user_id, created_at DESC, status)
        WHERE status IN ('draft', 'scheduled', 'published')
      `);

      // Optimize AI tasks queries
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_ai_tasks_user_created 
        ON ai_generation_tasks(user_id, created_at DESC)
      `);

      log('Slow query optimizations applied');
    } catch (error) {
      log(`Error optimizing slow queries: ${error}`);
      log('DB optimization skipped: ' + error.message);
      // Don't throw error - make it non-fatal
    }
  }
}

// Database backup utilities
export class DatabaseBackup {
  // Create database backup
  static async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./backups/backup-${timestamp}.sql`;
      
      // This would require pg_dump to be available
      // For now, we'll just log the backup request
      log(`Backup requested: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      log(`Error creating backup: ${error}`);
      throw error;
    }
  }

  // Restore database from backup
  static async restoreBackup(backupPath: string): Promise<void> {
    try {
      // This would require pg_restore to be available
      log(`Restore requested from: ${backupPath}`);
    } catch (error) {
      log(`Error restoring backup: ${error}`);
      throw error;
    }
  }
}

// Export singleton instances
export const dbMonitor = DatabaseMonitor.getInstance();
export const dbOptimizer = DatabaseOptimizer;
export const dbBackup = DatabaseBackup; 