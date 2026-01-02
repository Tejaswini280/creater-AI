import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Download, 
  Calendar, 
  Clock, 
  Hash, 
  Image, 
  Video, 
  FileText,
  Trash2,
  Copy,
  Edit,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { format, addDays, addHours, parseISO } from 'date-fns';

interface BulkContent {
  id: string;
  title: string;
  description: string;
  contentType: 'post' | 'story' | 'video' | 'reel' | 'article';
  platforms: string[];
  scheduledTime: Date;
  hashtags: string[];
  mediaUrls: string[];
  status: 'pending' | 'scheduled' | 'failed' | 'published';
  error?: string;
  template?: string;
}

interface BulkSchedulerProps {
  onScheduleComplete?: (scheduledContent: BulkContent[]) => void;
  onClose?: () => void;
}

export default function BulkScheduler({ onScheduleComplete, onClose }: BulkSchedulerProps) {
  const [bulkContent, setBulkContent] = useState<BulkContent[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'schedule' | 'results'>('upload');
  const [schedulingOptions, setSchedulingOptions] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    interval: 60, // minutes
    platforms: [] as string[],
    autoHashtags: true,
    optimizeTimings: true,
    skipWeekends: false
  });

  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-400' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black' }
  ];

  const contentTemplates = [
    {
      id: 'daily-tips',
      name: 'Daily Tips Series',
      description: 'Educational content with tips and insights',
      defaultHashtags: ['#tips', '#education', '#productivity'],
      contentType: 'post' as const
    },
    {
      id: 'behind-scenes',
      name: 'Behind the Scenes',
      description: 'Show your process and team culture',
      defaultHashtags: ['#behindthescenes', '#team', '#culture'],
      contentType: 'story' as const
    },
    {
      id: 'product-showcase',
      name: 'Product Showcase',
      description: 'Highlight features and benefits',
      defaultHashtags: ['#product', '#features', '#innovation'],
      contentType: 'video' as const
    },
    {
      id: 'user-generated',
      name: 'User Generated Content',
      description: 'Share customer stories and testimonials',
      defaultHashtags: ['#customers', '#testimonials', '#community'],
      contentType: 'post' as const
    }
  ];

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const newContent: BulkContent[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < headers.length) continue;
          
          const content: BulkContent = {
            id: `bulk-${Date.now()}-${i}`,
            title: values[headers.indexOf('title')] || `Content ${i}`,
            description: values[headers.indexOf('description')] || '',
            contentType: (values[headers.indexOf('contentType')] as any) || 'post',
            platforms: schedulingOptions.platforms,
            scheduledTime: new Date(),
            hashtags: values[headers.indexOf('hashtags')]?.split(' ') || [],
            mediaUrls: values[headers.indexOf('mediaUrls')]?.split(' ') || [],
            status: 'pending'
          };
          
          newContent.push(content);
        }
        
        setBulkContent(newContent);
        setCurrentStep('configure');
      } catch (error) {
        console.error('Error parsing CSV:', error);
      }
    };
    
    reader.readAsText(file);
  }, [schedulingOptions.platforms]);

  const handleManualAdd = () => {
    const newContent: BulkContent = {
      id: `manual-${Date.now()}`,
      title: '',
      description: '',
      contentType: 'post',
      platforms: schedulingOptions.platforms,
      scheduledTime: new Date(),
      hashtags: [],
      mediaUrls: [],
      status: 'pending'
    };
    
    setBulkContent([...bulkContent, newContent]);
  };

  const updateContent = (id: string, updates: Partial<BulkContent>) => {
    setBulkContent(prev => prev.map(content => 
      content.id === id ? { ...content, ...updates } : content
    ));
  };

  const removeContent = (id: string) => {
    setBulkContent(prev => prev.filter(content => content.id !== id));
  };

  const duplicateContent = (id: string) => {
    const original = bulkContent.find(c => c.id === id);
    if (!original) return;
    
    const duplicate: BulkContent = {
      ...original,
      id: `duplicate-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: 'pending'
    };
    
    setBulkContent(prev => [...prev, duplicate]);
  };

  const applyTemplate = (templateId: string) => {
    const template = contentTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    setBulkContent(prev => prev.map(content => ({
      ...content,
      contentType: template.contentType,
      hashtags: [...content.hashtags, ...template.defaultHashtags]
    })));
    
    setSelectedTemplate(templateId);
  };

  const generateScheduleTimes = () => {
    const startDateTime = new Date(`${schedulingOptions.startDate}T${schedulingOptions.startTime}`);
    let currentTime = startDateTime;
    
    const updatedContent = bulkContent.map((content, index) => {
      const scheduledTime = new Date(currentTime);
      
      // Skip weekends if option is enabled
      if (schedulingOptions.skipWeekends) {
        while (scheduledTime.getDay() === 0 || scheduledTime.getDay() === 6) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
      }
      
      // Apply optimal timing if enabled
      if (schedulingOptions.optimizeTimings) {
        const optimalHours = [9, 12, 15, 18]; // Peak engagement hours
        const currentHour = scheduledTime.getHours();
        const nearestOptimalHour = optimalHours.reduce((prev, curr) => 
          Math.abs(curr - currentHour) < Math.abs(prev - currentHour) ? curr : prev
        );
        scheduledTime.setHours(nearestOptimalHour);
      }
      
      currentTime = addHours(currentTime, schedulingOptions.interval / 60);
      
      return {
        ...content,
        scheduledTime,
        platforms: schedulingOptions.platforms
      };
    });
    
    setBulkContent(updatedContent);
    setCurrentStep('schedule');
  };

  const processBulkScheduling = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate API calls for each content item
      for (let i = 0; i < bulkContent.length; i++) {
        const content = bulkContent[i];
        
        // Update status to processing
        updateContent(content.id, { status: 'pending' });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        updateContent(content.id, {
          status: success ? 'scheduled' : 'failed',
          error: success ? undefined : 'Failed to schedule content'
        });
      }
      
      setCurrentStep('results');
      onScheduleComplete?.(bulkContent);
    } catch (error) {
      console.error('Bulk scheduling error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'title,description,contentType,hashtags,mediaUrls',
      'Sample Post Title,This is a sample description,post,#sample #content,https://example.com/image.jpg',
      'Another Post,Another description,video,#video #content,https://example.com/video.mp4'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-content-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Upload Content</h3>
        <p className="text-gray-600 mb-6">
          Upload a CSV file with your content or add items manually
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card className="p-6">
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Upload CSV File</h4>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with your content data
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Label htmlFor="csv-upload">
              <Button variant="outline" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Choose CSV File
              </Button>
            </Label>
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Manual Entry */}
        <Card className="p-6">
          <div className="text-center">
            <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Add Manually</h4>
            <p className="text-sm text-gray-600 mb-4">
              Create content items one by one
            </p>
            <Button onClick={handleManualAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content Item
            </Button>
          </div>
        </Card>
      </div>
      
      {bulkContent.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Content Items ({bulkContent.length})</h4>
            <Button onClick={() => setCurrentStep('configure')}>
              Continue to Configure
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bulkContent.map(content => (
              <div key={content.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{content.title || 'Untitled'}</div>
                  <div className="text-sm text-gray-600">{content.contentType}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => duplicateContent(content.id)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeContent(content.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Configure Scheduling</h3>
        <p className="text-gray-600 mb-6">
          Set up your scheduling preferences and content settings
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduling Options */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Scheduling Options</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={schedulingOptions.startDate}
                  onChange={(e) => setSchedulingOptions(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={schedulingOptions.startTime}
                  onChange={(e) => setSchedulingOptions(prev => ({
                    ...prev,
                    startTime: e.target.value
                  }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="interval">Interval (minutes)</Label>
              <Input
                id="interval"
                type="number"
                min="15"
                max="1440"
                value={schedulingOptions.interval}
                onChange={(e) => setSchedulingOptions(prev => ({
                  ...prev,
                  interval: parseInt(e.target.value) || 60
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="optimize-timings"
                  checked={schedulingOptions.optimizeTimings}
                  onCheckedChange={(checked) => setSchedulingOptions(prev => ({
                    ...prev,
                    optimizeTimings: checked as boolean
                  }))}
                />
                <Label htmlFor="optimize-timings">Optimize posting times</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-weekends"
                  checked={schedulingOptions.skipWeekends}
                  onCheckedChange={(checked) => setSchedulingOptions(prev => ({
                    ...prev,
                    skipWeekends: checked as boolean
                  }))}
                />
                <Label htmlFor="skip-weekends">Skip weekends</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-hashtags"
                  checked={schedulingOptions.autoHashtags}
                  onCheckedChange={(checked) => setSchedulingOptions(prev => ({
                    ...prev,
                    autoHashtags: checked as boolean
                  }))}
                />
                <Label htmlFor="auto-hashtags">Auto-generate hashtags</Label>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Platform Selection */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Select Platforms</h4>
          
          <div className="grid grid-cols-2 gap-3">
            {platforms.map(platform => (
              <div
                key={platform.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  schedulingOptions.platforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  const isSelected = schedulingOptions.platforms.includes(platform.id);
                  setSchedulingOptions(prev => ({
                    ...prev,
                    platforms: isSelected
                      ? prev.platforms.filter(p => p !== platform.id)
                      : [...prev.platforms, platform.id]
                  }));
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${platform.color}`} />
                  <span className="font-medium">{platform.name}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      {/* Content Templates */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Content Templates (Optional)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {contentTemplates.map(template => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => applyTemplate(template.id)}
            >
              <h5 className="font-medium mb-2">{template.name}</h5>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.defaultHashtags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
          Back
        </Button>
        <Button 
          onClick={generateScheduleTimes}
          disabled={schedulingOptions.platforms.length === 0}
        >
          Generate Schedule
        </Button>
      </div>
    </div>
  );

  const renderScheduleStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Review & Schedule</h3>
        <p className="text-gray-600 mb-6">
          Review your content schedule and confirm to proceed
        </p>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {bulkContent.map((content, index) => (
          <Card key={content.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{content.title}</span>
                  <Badge variant="outline">{content.contentType}</Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{content.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(content.scheduledTime, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(content.scheduledTime, 'h:mm a')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  {content.platforms.map(platformId => {
                    const platform = platforms.find(p => p.id === platformId);
                    return platform ? (
                      <div
                        key={platformId}
                        className={`w-6 h-6 rounded ${platform.color}`}
                        title={platform.name}
                      />
                    ) : null;
                  })}
                </div>
                
                {content.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.hashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  // Edit content logic
                }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeContent(content.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('configure')}>
          Back
        </Button>
        <Button 
          onClick={processBulkScheduling}
          disabled={isProcessing || bulkContent.length === 0}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Scheduling...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Schedule All ({bulkContent.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    const successful = bulkContent.filter(c => c.status === 'scheduled').length;
    const failed = bulkContent.filter(c => c.status === 'failed').length;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Scheduling Complete</h3>
          <p className="text-gray-600 mb-6">
            {successful} items scheduled successfully, {failed} failed
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{successful}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </Card>
          
          <Card className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </Card>
          
          <Card className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{bulkContent.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </Card>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {bulkContent.map(content => (
            <div key={content.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex items-center gap-3">
                {content.status === 'scheduled' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium">{content.title}</div>
                  {content.error && (
                    <div className="text-sm text-red-600">{content.error}</div>
                  )}
                </div>
              </div>
              <Badge className={content.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {content.status}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => {
            setBulkContent([]);
            setCurrentStep('upload');
          }}>
            Schedule More
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Bulk Content Scheduler
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-4 mt-4">
          {[
            { key: 'upload', label: 'Upload' },
            { key: 'configure', label: 'Configure' },
            { key: 'schedule', label: 'Schedule' },
            { key: 'results', label: 'Results' }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step.key
                  ? 'bg-blue-600 text-white'
                  : index < ['upload', 'configure', 'schedule', 'results'].indexOf(currentStep)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{step.label}</span>
              {index < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'configure' && renderConfigureStep()}
        {currentStep === 'schedule' && renderScheduleStep()}
        {currentStep === 'results' && renderResultsStep()}
      </CardContent>
    </Card>
  );
}