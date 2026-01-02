import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Pause, 
  Square, 
  AlertCircle 
} from 'lucide-react';

interface CalendarDayProps {
  day: {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayData?: {
      dayNumber: number;
      date: Date;
      content: any[];
      totalContent: number;
      publishedContent: number;
      unpublishedContent: number;
      pausedContent: number;
      stoppedContent: number;
    };
  };
  onDayClick: (dayData: any) => void;
}

export function CalendarDay({ day, onDayClick }: CalendarDayProps) {
  const { date, isCurrentMonth, isToday, dayData } = day;

  const getDayStatus = () => {
    if (!dayData) return null;
    
    if (dayData.stoppedContent > 0) {
      return { icon: Square, color: 'text-red-500', bgColor: 'bg-red-50' };
    }
    if (dayData.pausedContent > 0) {
      return { icon: Pause, color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    }
    if (dayData.publishedContent === dayData.totalContent) {
      return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' };
    }
    if (dayData.unpublishedContent > 0) {
      return { icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    }
    return { icon: AlertCircle, color: 'text-gray-500', bgColor: 'bg-gray-50' };
  };

  const status = getDayStatus();

  return (
    <div
      className={`
        min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
        ${isToday ? 'bg-blue-50 border-blue-300' : ''}
      `}
      onClick={() => dayData && onDayClick(dayData)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
          {date.getDate()}
        </span>
        {status && (
          <div className={`p-1 rounded-full ${status.bgColor}`}>
            <status.icon className={`h-3 w-3 ${status.color}`} />
          </div>
        )}
      </div>

      {dayData && (
        <div className="space-y-1">
          {/* Content count */}
          <div className="text-xs text-gray-600">
            {dayData.totalContent} content
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-1">
            {dayData.publishedContent > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {dayData.publishedContent}✓
              </Badge>
            )}
            {dayData.unpublishedContent > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {dayData.unpublishedContent}⏳
              </Badge>
            )}
            {dayData.pausedContent > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0 text-yellow-600">
                {dayData.pausedContent}⏸
              </Badge>
            )}
            {dayData.stoppedContent > 0 && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                {dayData.stoppedContent}⏹
              </Badge>
            )}
          </div>

          {/* Day number indicator */}
          <div className="text-xs text-blue-600 font-medium">
            Day {dayData.dayNumber}
          </div>
        </div>
      )}

      {!dayData && isCurrentMonth && (
        <div className="text-xs text-gray-400 mt-2">
          No content
        </div>
      )}
    </div>
  );
}
