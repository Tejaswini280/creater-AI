import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  Clock, 
  Youtube, 
  Instagram, 
  Facebook,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { format } from "date-fns";

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContent?: any;
  onScheduled?: (scheduledContent: any) => void;
}

interface ScheduleFormData {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  scheduledDate: Date | undefined;
  scheduledTime: string;
  autoPost: boolean;
  timezone: string;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'red' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'pink' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'blue' },
  { value: 'tiktok', label: 'TikTok', icon: Youtube, color: 'black' },
];

const CONTENT_TYPES = {
  youtube: [
    { value: 'video', label: 'YouTube Video' },
    { value: 'short', label: 'YouTube Shorts' },
    { value: 'premiere', label: 'Premiere' },
  ],
  instagram: [
    { value: 'post', label: 'Instagram Post' },
    { value: 'reel', label: 'Instagram Reel' },
    { value: 'story', label: 'Instagram Story' },
  ],
  facebook: [
    { value: 'post', label: 'Facebook Post' },
    { value: 'video', label: 'Facebook Video' },
    { value: 'story', label: 'Facebook Story' },
  ],
  tiktok: [
    { value: 'video', label: 'TikTok Video' },
  ],
};

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [
    { value: `${hour}:00`, label: `${hour}:00` },
    { value: `${hour}:30`, label: `${hour}:30` },
  ];
}).flat();

export default function SchedulingModal({ isOpen, onClose, editingContent, onScheduled }: SchedulingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: editingContent?.title || '',
    description: editingContent?.description || '',
    platform: editingContent?.platform || 'youtube',
    contentType: editingContent?.contentType || 'video',
    scheduledDate: editingContent?.scheduledAt ? new Date(editingContent.scheduledAt) : undefined,
    scheduledTime: editingContent?.scheduledAt 
      ? format(new Date(editingContent.scheduledAt), 'HH:mm')
      : '09:00',
    autoPost: editingContent?.autoPost ?? true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [errors, setErrors] = useState<Partial<ScheduleFormData>>({});

  // Update form data when editingContent changes
  useEffect(() => {
    if (editingContent) {
      setFormData({
        title: editingContent.title || '',
        description: editingContent.description || '',
        platform: editingContent.platform || 'youtube',
        contentType: editingContent.contentType || 'video',
        scheduledDate: editingContent.scheduledAt ? new Date(editingContent.scheduledAt) : undefined,
        scheduledTime: editingContent.scheduledAt 
          ? format(new Date(editingContent.scheduledAt), 'HH:mm') as string
          : '09:00',
        autoPost: editingContent.autoPost ?? true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        description: '',
        platform: 'youtube',
        contentType: 'video',
        scheduledDate: undefined,
        scheduledTime: '09:00',
        autoPost: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    setErrors({});
  }, [editingContent]);

  const scheduleContentMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const scheduledDateTime = data.scheduledDate 
        ? new Date(`${format(data.scheduledDate, 'yyyy-MM-dd')} ${data.scheduledTime}`)
        : new Date();

      const payload = {
        ...data,
        scheduledAt: scheduledDateTime.toISOString(),
        id: editingContent?.id,
      };

      const endpoint = editingContent?.id 
        ? `/api/content/schedule/${editingContent.id}`
        : '/api/content/schedule';
      
      const method = editingContent?.id ? 'PUT' : 'POST';

      const response = await apiRequest(method, endpoint, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: editingContent ? "Schedule Updated!" : "Content Scheduled!",
        description: `Your content will be posted on ${format(formData.scheduledDate!, 'PPP') as string} at ${formData.scheduledTime}.`,
      });
      
      // Invalidate both general content queries and specific scheduled content queries
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/content/scheduled'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/content/scheduled', { limit: 5 }] 
      });
      onScheduled?.(data);
      handleReset();
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
        return;
      }
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<ScheduleFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.platform) {
      newErrors.platform = 'Platform is required';
    }

    if (!formData.contentType) {
      newErrors.contentType = 'Content type is required';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required' as any;
    } else if (formData.scheduledDate < new Date()) {
      newErrors.scheduledDate = 'Scheduled date must be in the future' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    scheduleContentMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      platform: 'youtube',
      contentType: 'video',
      scheduledDate: undefined,
      scheduledTime: '09:00',
      autoPost: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof ScheduleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const selectedPlatform = PLATFORMS.find(p => p.value === formData.platform);
  const availableContentTypes = CONTENT_TYPES[formData.platform as keyof typeof CONTENT_TYPES] || [];

  const getOptimalTimeSlots = () => {
    const platform = formData.platform;
    const day = formData.scheduledDate?.getDay() || 0; // 0 = Sunday
    
    // Platform-specific optimal posting times
    const optimalTimes: Record<string, string[]> = {
      youtube: ['09:00', '14:00', '16:00', '20:00'],
      instagram: ['11:00', '13:00', '17:00', '19:00'],
      facebook: ['09:00', '13:00', '15:00'],
      tiktok: ['06:00', '10:00', '19:00', '21:00'],
    };

    return optimalTimes[platform] || ['09:00', '12:00', '15:00', '18:00'];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="scheduling-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
            {editingContent ? 'Edit Schedule' : 'Schedule Content'}
          </DialogTitle>
          <DialogDescription id="scheduling-description">
            Schedule your content for automatic posting to social media platforms
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Content Title *
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter content title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Platform and Content Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Platform *</Label>
              <Select 
                value={formData.platform} 
                onValueChange={(value) => {
                  handleInputChange('platform', value);
                  // Reset content type when platform changes
                  const newContentTypes = CONTENT_TYPES[value as keyof typeof CONTENT_TYPES];
                  if (newContentTypes?.length > 0) {
                    handleInputChange('contentType', newContentTypes[0].value);
                  }
                }}
              >
                <SelectTrigger className={errors.platform ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{platform.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-red-500">{errors.platform}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Content Type *</Label>
              <Select value={formData.contentType} onValueChange={(value) => handleInputChange('contentType', value)}>
                <SelectTrigger className={errors.contentType ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableContentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contentType && (
                <p className="text-sm text-red-500">{errors.contentType}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your content..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Scheduled Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !formData.scheduledDate && "text-muted-foreground"
                    } ${errors.scheduledDate ? 'border-red-500' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? (
                      format(formData.scheduledDate, "PPP") as string
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => handleInputChange('scheduledDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.scheduledDate && (
                <p className="text-sm text-red-500">{errors.scheduledDate as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Scheduled Time
              </Label>
              <Select value={formData.scheduledTime} onValueChange={(value) => handleInputChange('scheduledTime', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_SLOTS.map((slot) => {
                    const isOptimal = getOptimalTimeSlots().includes(slot.value);
                    return (
                      <SelectItem key={slot.value} value={slot.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{slot.label}</span>
                          {isOptimal && (
                            <Badge variant="outline" className="ml-2 text-xs text-green-600 border-green-200">
                              Optimal
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Timezone: {formData.timezone}
              </p>
            </div>
          </div>

          {/* Auto-post Setting */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="autoPost"
              checked={formData.autoPost}
              onChange={(e) => handleInputChange('autoPost', e.target.checked)}
              className="rounded border-gray-300"
            />
            <div className="flex-1">
              <Label htmlFor="autoPost" className="text-sm font-medium text-gray-700">
                Enable automatic posting
              </Label>
              <p className="text-xs text-gray-500">
                Content will be posted automatically at the scheduled time
              </p>
            </div>
            {formData.autoPost ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
          </div>

          {/* Scheduling Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Scheduling Tips</h4>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• {selectedPlatform?.label} optimal times are highlighted</li>
                  <li>• Consider your audience's timezone</li>
                  <li>• Schedule during peak engagement hours</li>
                  {!formData.autoPost && (
                    <li>• Manual posting: You'll get a notification when it's time</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={scheduleContentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={scheduleContentMutation.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {scheduleContentMutation.isPending ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingContent ? 'Updating...' : 'Scheduling...'}
                </div>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  {editingContent ? 'Update Schedule' : 'Schedule Content'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}