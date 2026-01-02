/**
 * FIXED Date and timezone utility functions - ROOT LEVEL FIX
 */

export interface TimezoneInfo {
  id: string;
  displayName: string;
  offset: string;
}

export const TIMEZONE_OPTIONS: TimezoneInfo[] = [
  { id: 'UTC', displayName: 'UTC (Coordinated Universal Time)', offset: '+00:00' },
  { id: 'America/New_York', displayName: 'EST (Eastern Time)', offset: '-05:00' },
  { id: 'America/Los_Angeles', displayName: 'PST (Pacific Time)', offset: '-08:00' },
  { id: 'Europe/London', displayName: 'GMT (Greenwich Mean Time)', offset: '+00:00' },
  { id: 'Asia/Kolkata', displayName: 'IST (Indian Standard Time)', offset: '+05:30' },
  { id: 'Europe/Paris', displayName: 'CET (Central European Time)', offset: '+01:00' },
  { id: 'Asia/Tokyo', displayName: 'JST (Japan Standard Time)', offset: '+09:00' },
  { id: 'Australia/Sydney', displayName: 'AEST (Australian Eastern Time)', offset: '+10:00' },
  { id: 'Asia/Dubai', displayName: 'GST (Gulf Standard Time)', offset: '+04:00' },
  { id: 'Asia/Singapore', displayName: 'SGT (Singapore Time)', offset: '+08:00' },
];

/**
 * Get timezone display name from timezone ID
 */
export const getTimezoneDisplayName = (timezoneId: string): string => {
  const timezone = TIMEZONE_OPTIONS.find(tz => tz.id === timezoneId);
  return timezone?.displayName || timezoneId;
};

/**
 * FIXED: Format a date in a specific timezone - ALWAYS uses the input date, never today's date
 */
export const formatDateInTimezone = (
  dateString: string, 
  timezoneId: string = 'UTC',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!dateString) return 'Not set';
  
  try {
    // CRITICAL FIX: Parse the date string correctly without timezone conversion
    let date: Date;
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For YYYY-MM-DD format, create date at noon to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      date = new Date(year, month - 1, day, 12, 0, 0, 0);
    } else {
      date = new Date(dateString);
    }
    
    // CRITICAL: Ensure we're not accidentally using today's date
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    // Default formatting options
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezoneId,
      ...options
    };
    
    const formatted = date.toLocaleDateString('en-US', defaultOptions);
    console.log(`🔍 formatDateInTimezone: ${dateString} -> ${formatted} (timezone: ${timezoneId})`);
    return formatted;
  } catch (error) {
    console.error('Error formatting date in timezone:', error, { dateString, timezoneId });
    return 'Invalid date';
  }
};

/**
 * FIXED: Get relative time description - ALWAYS uses the input date
 */
export const getRelativeTime = (dateString: string, timezoneId: string = 'UTC'): string => {
  if (!dateString) return 'Unknown';
  
  try {
    let inputDate: Date;
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For YYYY-MM-DD format, create date at noon
      const [year, month, day] = dateString.split('-').map(Number);
      inputDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    } else {
      inputDate = new Date(dateString);
    }
    
    if (isNaN(inputDate.getTime())) {
      return 'Invalid date';
    }
    
    // Get current date at noon for fair comparison
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    
    const diffMs = inputDate.getTime() - currentDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    console.log(`🔍 getRelativeTime: ${dateString} -> ${diffDays} days difference`);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    
    return formatDateInTimezone(dateString, timezoneId);
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid date';
  }
};

/**
 * FIXED: Check if a date string represents today - NEVER returns true unless it's actually today
 */
export const isToday = (dateString: string, timezoneId: string): boolean => {
  if (!dateString) return false;
  
  try {
    let inputDate: Date;
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      inputDate = new Date(year, month - 1, day);
    } else {
      inputDate = new Date(dateString);
    }
    
    if (isNaN(inputDate.getTime())) {
      return false;
    }
    
    const today = new Date();
    
    const isActuallyToday = inputDate.getFullYear() === today.getFullYear() &&
                           inputDate.getMonth() === today.getMonth() &&
                           inputDate.getDate() === today.getDate();
    
    console.log(`🔍 isToday: ${dateString} -> ${isActuallyToday}`);
    return isActuallyToday;
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Get current date in a specific timezone as YYYY-MM-DD format
 */
export const getCurrentDateInTimezone = (timezoneId: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now);
  } catch (error) {
    console.error('Error getting current date in timezone:', error);
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Create a timezone-aware date string (simplified - just return the input for now)
 */
export const createTimezoneAwareDate = (dateString: string, timezoneId: string): string => {
  if (!dateString) return new Date().toISOString();
  
  // For YYYY-MM-DD format, return as-is (the display logic will handle timezone formatting)
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // For other formats, try to parse and return ISO format
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.error('Error creating timezone-aware date:', error);
    return new Date().toISOString();
  }
};

/**
 * Format a date with time in a specific timezone
 */
export const formatDateTimeInTimezone = (
  dateString: string, 
  timezoneId: string = 'UTC',
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezoneId,
      ...options
    };
    
    return date.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.error('Error formatting datetime in timezone:', error);
    return 'Invalid date';
  }
};