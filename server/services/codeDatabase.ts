import { db } from "../db";
import { generatedCode, type InsertGeneratedCode, type GeneratedCode } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export class CodeDatabaseService {
  /**
   * Save generated code to database
   */
  static async saveGeneratedCode(data: {
    userId: string;
    description: string;
    language: string;
    framework?: string;
    code: string;
    explanation?: string;
    dependencies?: string[];
  }): Promise<GeneratedCode> {
    try {
      console.log('💾 Saving generated code to database for user:', data.userId);

      const codeRecord: InsertGeneratedCode = {
        id: nanoid(),
        userId: data.userId,
        description: data.description.trim(),
        language: data.language.toLowerCase(),
        framework: data.framework?.trim() || null,
        code: data.code,
        explanation: data.explanation || null,
        dependencies: data.dependencies || [],
      };

      const [savedCode] = await db
        .insert(generatedCode)
        .values(codeRecord)
        .returning();

      console.log('✅ Generated code saved successfully with ID:', savedCode.id);
      return savedCode;
    } catch (error) {
      console.error('❌ Error saving generated code:', error);
      throw new Error('Failed to save generated code to database');
    }
  }

  /**
   * Get generated code history for a user
   */
  static async getUserCodeHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      language?: string;
    } = {}
  ): Promise<GeneratedCode[]> {
    try {
      const { limit = 20, offset = 0, language } = options;

      console.log('📚 Fetching code history for user:', userId);

      let query = db
        .select()
        .from(generatedCode)
        .where(eq(generatedCode.userId, userId))
        .orderBy(desc(generatedCode.createdAt))
        .limit(limit)
        .offset(offset);

      // Add language filter if specified
      if (language) {
        query = query.where(eq(generatedCode.language, language.toLowerCase()));
      }

      const history = await query;

      console.log('✅ Retrieved', history.length, 'code records');
      return history;
    } catch (error) {
      console.error('❌ Error fetching code history:', error);
      throw new Error('Failed to fetch code history');
    }
  }

  /**
   * Get generated code by ID
   */
  static async getGeneratedCodeById(id: string, userId: string): Promise<GeneratedCode | null> {
    try {
      console.log('🔍 Fetching generated code by ID:', id);

      const [codeRecord] = await db
        .select()
        .from(generatedCode)
        .where(eq(generatedCode.id, id))
        .where(eq(generatedCode.userId, userId))
        .limit(1);

      if (!codeRecord) {
        console.log('❌ Generated code not found or access denied');
        return null;
      }

      console.log('✅ Generated code retrieved successfully');
      return codeRecord;
    } catch (error) {
      console.error('❌ Error fetching generated code:', error);
      throw new Error('Failed to fetch generated code');
    }
  }

  /**
   * Delete generated code
   */
  static async deleteGeneratedCode(id: string, userId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting generated code:', id);

      const result = await db
        .delete(generatedCode)
        .where(eq(generatedCode.id, id))
        .where(eq(generatedCode.userId, userId));

      const deleted = result.rowCount > 0;
      
      if (deleted) {
        console.log('✅ Generated code deleted successfully');
      } else {
        console.log('❌ Generated code not found or access denied');
      }

      return deleted;
    } catch (error) {
      console.error('❌ Error deleting generated code:', error);
      throw new Error('Failed to delete generated code');
    }
  }

  /**
   * Get code generation statistics for a user
   */
  static async getUserCodeStats(userId: string): Promise<{
    totalGenerated: number;
    languageBreakdown: { language: string; count: number }[];
    recentActivity: number; // Last 7 days
  }> {
    try {
      console.log('📊 Fetching code generation stats for user:', userId);

      // Get all user's generated code
      const userCodes = await db
        .select()
        .from(generatedCode)
        .where(eq(generatedCode.userId, userId));

      // Calculate statistics
      const totalGenerated = userCodes.length;

      // Language breakdown
      const languageCounts = userCodes.reduce((acc, code) => {
        acc[code.language] = (acc[code.language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const languageBreakdown = Object.entries(languageCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count);

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentActivity = userCodes.filter(
        code => code.createdAt && new Date(code.createdAt) > sevenDaysAgo
      ).length;

      console.log('✅ Code generation stats calculated');
      
      return {
        totalGenerated,
        languageBreakdown,
        recentActivity
      };
    } catch (error) {
      console.error('❌ Error fetching code stats:', error);
      throw new Error('Failed to fetch code generation statistics');
    }
  }
}