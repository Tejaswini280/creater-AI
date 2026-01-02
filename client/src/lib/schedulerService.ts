import { apiRequest } from "./queryClient";

export interface ScheduledContent {
  id: string;
  title: string;
  description: string;
  platform: string;
  contentType: string;
  status: string;
  scheduledAt: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export interface ScheduleRequest {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  scheduledAt: string;
  recurrence?: string;
  timezone?: string;
}

export class SchedulerService {
  /**
   * Get all scheduled content for the current user
   */
  static async getScheduledContent(): Promise<{
    scheduledContent: ScheduledContent[];
    seriesContent: ScheduledContent[];
  }> {
    const response = await apiRequest('GET', '/api/content/scheduled');
    return await response.json();
  }

  /**
   * Schedule new content
   */
  static async scheduleContent(data: ScheduleRequest): Promise<ScheduledContent> {
    const response = await apiRequest('POST', '/api/content/schedule', data);
    const result = await response.json();
    return result.scheduledContent;
  }

  /**
   * Update scheduled content
   */
  static async updateScheduledContent(id: string, updates: Partial<ScheduledContent>): Promise<ScheduledContent> {
    const response = await apiRequest('PUT', `/api/content/schedule/${id}`, updates);
    const result = await response.json();
    return result.content;
  }

  /**
   * Delete scheduled content
   */
  static async deleteScheduledContent(id: string): Promise<void> {
    await apiRequest('DELETE', `/api/content/schedule/${id}`);
  }

  /**
   * Get optimal posting times for a platform
   */
  static async getOptimalTimes(platform: string): Promise<string[]> {
    const response = await apiRequest('GET', `/api/content/schedule/optimal-times/${platform}`);
    const result = await response.json();
    return result.optimalTimes;
  }

  /**
   * Bulk schedule content
   */
  static async bulkScheduleContent(contentIds: string[], scheduledAt: string, platform: string): Promise<any> {
    const response = await apiRequest('POST', '/api/content/schedule/bulk', {
      contentIds,
      scheduledAt,
      platform
    });
    return await response.json();
  }

  /**
   * Bulk delete scheduled content
   */
  static async bulkDeleteScheduledContent(contentIds: string[]): Promise<any> {
    const response = await apiRequest('DELETE', '/api/content/schedule/bulk', {
      contentIds
    });
    return await response.json();
  }

  /**
   * Reschedule content
   */
  static async rescheduleContent(id: string, scheduledAt: string): Promise<ScheduledContent> {
    const response = await apiRequest('POST', `/api/content/schedule/${id}/reschedule`, {
      scheduledAt
    });
    const result = await response.json();
    return result.content;
  }

  /**
   * Cancel scheduled content
   */
  static async cancelScheduledContent(id: string): Promise<void> {
    await apiRequest('POST', `/api/content/schedule/${id}/cancel`);
  }

  /**
   * Get scheduling analytics
   */
  static async getSchedulingAnalytics(): Promise<{
    totalScheduled: number;
    totalPublished: number;
    totalFailed: number;
    successRate: number;
    averageEngagement: number;
    platformBreakdown: Record<string, number>;
  }> {
    const response = await apiRequest('GET', '/api/content/schedule/analytics');
    const result = await response.json();
    return result.analytics;
  }

  /**
   * Format date for scheduling
   */
  static formatScheduleDate(date: Date, time: string): string {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}T${time}:00.000Z`;
  }

  /**
   * Parse scheduled date for display
   */
  static parseScheduledDate(scheduledAt: string): { date: Date; time: string } {
    const date = new Date(scheduledAt);
    const time = date.toTimeString().slice(0, 5); // HH:MM format
    return { date, time };
  }

  /**
   * Get platform icon
   */
  static getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      youtube: "🎥",
      instagram: "📷",
      facebook: "👥",
      twitter: "🐦",
      linkedin: "💼",
      tiktok: "🎵"
    };
    return icons[platform.toLowerCase()] || "📱";
  }

  /**
   * Get status color
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: "blue",
      published: "green",
      failed: "red",
      cancelled: "gray",
      draft: "yellow"
    };
    return colors[status.toLowerCase()] || "gray";
  }

  /**
   * Validate schedule time
   */
  static validateScheduleTime(scheduledAt: string): { isValid: boolean; error?: string } {
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();

    if (isNaN(scheduledDate.getTime())) {
      return { isValid: false, error: "Invalid date format" };
    }

    if (scheduledDate <= now) {
      return { isValid: false, error: "Scheduled time must be in the future" };
    }

    // Check if it's too far in the future (e.g., more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (scheduledDate > oneYearFromNow) {
      return { isValid: false, error: "Scheduled time cannot be more than 1 year in the future" };
    }

    return { isValid: true };
  }

  /**
   * Get next optimal time for platform
   */
  static async getNextOptimalTime(platform: string): Promise<Date> {
    const optimalTimes = await this.getOptimalTimes(platform);
    
    if (optimalTimes.length === 0) {
      // Default to next hour if no optimal times
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find next optimal time today
    for (const timeStr of optimalTimes) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const optimalTime = new Date(today);
      optimalTime.setHours(hours, minutes, 0, 0);

      if (optimalTime > now) {
        return optimalTime;
      }
    }

    // If no optimal time today, use first optimal time tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hours, minutes] = optimalTimes[0].split(':').map(Number);
    tomorrow.setHours(hours, minutes, 0, 0);

    return tomorrow;
  }
}