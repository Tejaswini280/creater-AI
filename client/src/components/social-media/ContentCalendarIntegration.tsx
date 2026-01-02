import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, Pause, Square, AlertCircle } from 'lucide-react';
import { ContentItem } from './ContentCard';

interface ContentCalendarIntegrationProps {
  contents: ContentItem[];
  onContentUpdate: (contentId: number, action: string, data?: any) => Promise<void>;
  projectId: number;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  status: string;
  platform: string;
  dayNumber: number;
  content: ContentItem;
}

export const ContentCalendarIntegration: React.FC<ContentCalendarIntegrationProps> = ({
  contents,
  onContentUpdate,
  projectId
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Convert contents to calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = contents.map(content => ({
      id: content.id,
      title: content.title,
      date: content.scheduledTime ? new Date(content.scheduledTime) : new Date(),
      status: content.status,
      platform: content.platform,
      dayNumber: content.dayNumber,
      content
    }));

    setEvents(calendarEvents);
  }, [contents]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'deleted':
        return <Square className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      instagram: '📷',
      youtube: '📺',
      tiktok: '🎵',
      linkedin: '💼',
      facebook: '👥',
      twitter: '🐦',
      pinterest: '📌'
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const getEventsForWeek = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return events.filter(event => 
      event.date >= startDate && event.date <= endDate
    );
  };

  const handleEventAction = async (event: CalendarEvent, action: string) => {
    try {
      await onContentUpdate(event.content.id, action);
    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
    }
  };

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const weekEvents = getEventsForWeek(weekStart);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Content Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {events.length} events
          </Badge>
          <Button variant="outline" size="sm">
            View Full Calendar
          </Button>
        </div>
      </div>

      {/* Week View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week's Content</CardTitle>
        </CardHeader>
        <CardContent>
          {weekEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content scheduled</h3>
              <p className="text-gray-500">Content will appear here when scheduled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weekEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlatformIcon(event.platform)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          Day {event.dayNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{event.date.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="ml-1 capitalize">{event.status}</span>
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      {event.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEventAction(event, 'pause')}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {event.status === 'paused' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEventAction(event, 'play')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {events.filter(e => e.status === 'published').length}
                </div>
                <div className="text-sm text-green-700">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {events.filter(e => e.status === 'scheduled').length}
                </div>
                <div className="text-sm text-blue-700">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-900">
                  {events.filter(e => e.status === 'paused').length}
                </div>
                <div className="text-sm text-yellow-700">Paused</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {events.filter(e => e.status === 'draft').length}
                </div>
                <div className="text-sm text-gray-700">Draft</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentCalendarIntegration;
