import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause,
  Settings,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

interface RecurrenceRule {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number; // For monthly recurrence
  monthOfYear?: number; // For yearly recurrence
  endDate?: Date;
  maxOccurrences?: number;
  isActive: boolean;
  contentTemplate?: {
    title: string;
    description: string;
    contentType: string;
    platforms: string[];
    hashtags: string[];
  };
  nextScheduledDate?: Date;
  totalScheduled: number;
  successRate: number;
}

interface RecurrenceManagerProps {
  onRuleCreate?: (rule: RecurrenceRule) => void;
  onRuleUpdate?: (rule: RecurrenceRule) => void;
  onRuleDelete?: (ruleId: string) => void;
  onClose?: () => void;
}

export default function RecurrenceManager({ 
  onRuleCreate, 
  onRuleUpdate, 
  onRuleDelete, 
  onClose 
}: RecurrenceManagerProps) {
  const [rules, setRules] = useState<RecurrenceRule[]>([]);
  const [editingRule, setEditingRule] = useState<RecurrenceRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');

  // Sample data - replace with API call
  useEffect(() => {
    const sampleRules: RecurrenceRule[] = [
      {
        id: '1',
        name: 'Daily Tips Series',
        description: 'Post educational tips every weekday at 9 AM',
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        isActive: true,
        contentTemplate: {
          title: 'Daily Tip #{count}',
          description: 'Today\'s productivity tip for content creators',
          contentType: 'post',
          platforms: ['linkedin', 'twitter'],
          hashtags: ['#tips', '#productivity', '#contentcreator']
        },
        nextScheduledDate: new Date(2025, 0, 27, 9, 0),
        totalScheduled: 45,
        successRate: 95.6
      },
      {
        id: '2',
        name: 'Weekly Newsletter',
        description: 'Send weekly newsletter every Monday at 8 AM',
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1], // Monday
        isActive: true,
        contentTemplate: {
          title: 'Weekly Newsletter - Week of {date}',
          description: 'This week\'s highlights and upcoming content',
          contentType: 'article',
          platforms: ['linkedin', 'medium'],
          hashtags: ['#newsletter', '#weekly', '#updates']
        },
        nextScheduledDate: new Date(2025, 0, 27, 8, 0),
        totalScheduled: 12,
        successRate: 100
      },
      {
        id: '3',
        name: 'Monthly Product Update',
        description: 'Share product updates on the first of each month',
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 1,
        isActive: false,
        contentTemplate: {
          title: 'Product Update - {month} {year}',
          description: 'Latest features and improvements in our product',
          contentType: 'video',
          platforms: ['youtube', 'linkedin'],
          hashtags: ['#product', '#update', '#features']
        },
        nextScheduledDate: new Date(2025, 1, 1, 10, 0),
        totalScheduled: 8,
        successRate: 87.5
      }
    ];
    setRules(sampleRules);
  }, []);

  const createNewRule = (): RecurrenceRule => ({
    id: `rule-${Date.now()}`,
    name: '',
    description: '',
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [1], // Default to Monday
    isActive: true,
    totalScheduled: 0,
    successRate: 0
  });

  const handleCreateRule = () => {
    setEditingRule(createNewRule());
    setCurrentView('create');
  };

  const handleEditRule = (rule: RecurrenceRule) => {
    setEditingRule({ ...rule });
    setCurrentView('edit');
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    if (currentView === 'create') {
      const newRule = { ...editingRule };
      setRules(prev => [...prev, newRule]);
      onRuleCreate?.(newRule);
    } else {
      setRules(prev => prev.map(rule => 
        rule.id === editingRule.id ? editingRule : rule
      ));
      onRuleUpdate?.(editingRule);
    }

    setEditingRule(null);
    setCurrentView('list');
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this recurrence rule?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      onRuleDelete?.(ruleId);
    }
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const getFrequencyDescription = (rule: RecurrenceRule) => {
    switch (rule.frequency) {
      case 'daily':
        return `Every ${rule.interval === 1 ? 'day' : `${rule.interval} days`}`;
      case 'weekly':
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = rule.daysOfWeek?.map(day => dayNames[day]).join(', ') || '';
        return `Every ${rule.interval === 1 ? 'week' : `${rule.interval} weeks`} on ${selectedDays}`;
      case 'monthly':
        return `Every ${rule.interval === 1 ? 'month' : `${rule.interval} months`} on day ${rule.dayOfMonth}`;
      case 'yearly':
        return `Every ${rule.interval === 1 ? 'year' : `${rule.interval} years`}`;
      case 'custom':
        return 'Custom pattern';
      default:
        return 'Unknown frequency';
    }
  };

  const renderRulesList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recurrence Rules</h3>
          <p className="text-gray-600">Manage your recurring content schedules</p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <Card key={rule.id} className={`transition-all ${rule.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{rule.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Frequency</div>
                      <div className="text-gray-600">{getFrequencyDescription(rule)}</div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Next Scheduled</div>
                      <div className="text-gray-600">
                        {rule.nextScheduledDate ? format(rule.nextScheduledDate, 'MMM d, yyyy h:mm a') : 'Not scheduled'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700">Performance</div>
                      <div className="text-gray-600">
                        {rule.totalScheduled} posts, {rule.successRate}% success
                      </div>
                    </div>
                  </div>
                  
                  {rule.contentTemplate && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-1">Content Template</div>
                      <div className="text-sm text-gray-600 mb-2">{rule.contentTemplate.title}</div>
                      <div className="flex flex-wrap gap-1">
                        {rule.contentTemplate.platforms.map(platform => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                        {rule.contentTemplate.hashtags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRuleStatus(rule.id)}
                    title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                  >
                    {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {rules.length === 0 && (
          <Card className="p-8 text-center">
            <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">No Recurrence Rules</h4>
            <p className="text-gray-600 mb-4">Create your first recurring content schedule</p>
            <Button onClick={handleCreateRule}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </Card>
        )}
      </div>
    </div>
  );

  const renderRuleForm = () => {
    if (!editingRule) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {currentView === 'create' ? 'Create Recurrence Rule' : 'Edit Recurrence Rule'}
            </h3>
            <p className="text-gray-600">Set up automated content scheduling</p>
          </div>
          <Button variant="ghost" onClick={() => setCurrentView('list')}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Basic Information</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Daily Tips Series"
                />
              </div>
              
              <div>
                <Label htmlFor="rule-description">Description</Label>
                <Input
                  id="rule-description"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of this rule"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rule-active"
                  checked={editingRule.isActive}
                  onCheckedChange={(checked) => setEditingRule(prev => prev ? { ...prev, isActive: checked as boolean } : null)}
                />
                <Label htmlFor="rule-active">Active</Label>
              </div>
            </div>
          </Card>

          {/* Frequency Settings */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Frequency Settings</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={editingRule.frequency}
                  onValueChange={(value: any) => setEditingRule(prev => prev ? { ...prev, frequency: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="interval">Interval</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={editingRule.interval}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, interval: parseInt(e.target.value) || 1 } : null)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Every {editingRule.interval} {editingRule.frequency === 'daily' ? 'day(s)' : 
                    editingRule.frequency === 'weekly' ? 'week(s)' : 
                    editingRule.frequency === 'monthly' ? 'month(s)' : 'year(s)'}
                </p>
              </div>
              
              {editingRule.frequency === 'weekly' && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <div key={day} className="text-center">
                        <Checkbox
                          id={`day-${index}`}
                          checked={editingRule.daysOfWeek?.includes(index) || false}
                          onCheckedChange={(checked) => {
                            const currentDays = editingRule.daysOfWeek || [];
                            const newDays = checked
                              ? [...currentDays, index]
                              : currentDays.filter(d => d !== index);
                            setEditingRule(prev => prev ? { ...prev, daysOfWeek: newDays } : null);
                          }}
                        />
                        <Label htmlFor={`day-${index}`} className="text-xs block mt-1">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {editingRule.frequency === 'monthly' && (
                <div>
                  <Label htmlFor="day-of-month">Day of Month</Label>
                  <Input
                    id="day-of-month"
                    type="number"
                    min="1"
                    max="31"
                    value={editingRule.dayOfMonth || 1}
                    onChange={(e) => setEditingRule(prev => prev ? { ...prev, dayOfMonth: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Content Template */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Content Template (Optional)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-title">Title Template</Label>
              <Input
                id="template-title"
                value={editingRule.contentTemplate?.title || ''}
                onChange={(e) => setEditingRule(prev => prev ? {
                  ...prev,
                  contentTemplate: {
                    ...prev.contentTemplate,
                    title: e.target.value,
                    description: prev.contentTemplate?.description || '',
                    contentType: prev.contentTemplate?.contentType || 'post',
                    platforms: prev.contentTemplate?.platforms || [],
                    hashtags: prev.contentTemplate?.hashtags || []
                  }
                } : null)}
                placeholder="e.g., Daily Tip #{count}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {'{count}'}, {'{date}'}, {'{month}'}, {'{year}'} for dynamic values
              </p>
            </div>
            
            <div>
              <Label htmlFor="template-description">Description Template</Label>
              <Input
                id="template-description"
                value={editingRule.contentTemplate?.description || ''}
                onChange={(e) => setEditingRule(prev => prev ? {
                  ...prev,
                  contentTemplate: {
                    ...prev.contentTemplate,
                    title: prev.contentTemplate?.title || '',
                    description: e.target.value,
                    contentType: prev.contentTemplate?.contentType || 'post',
                    platforms: prev.contentTemplate?.platforms || [],
                    hashtags: prev.contentTemplate?.hashtags || []
                  }
                } : null)}
                placeholder="Template description"
              />
            </div>
          </div>
        </Card>

        {/* End Conditions */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">End Conditions (Optional)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={editingRule.endDate ? format(editingRule.endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEditingRule(prev => prev ? {
                  ...prev,
                  endDate: e.target.value ? new Date(e.target.value) : undefined
                } : null)}
              />
            </div>
            
            <div>
              <Label htmlFor="max-occurrences">Max Occurrences</Label>
              <Input
                id="max-occurrences"
                type="number"
                min="1"
                value={editingRule.maxOccurrences || ''}
                onChange={(e) => setEditingRule(prev => prev ? {
                  ...prev,
                  maxOccurrences: e.target.value ? parseInt(e.target.value) : undefined
                } : null)}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentView('list')}>
            Cancel
          </Button>
          <Button onClick={handleSaveRule} disabled={!editingRule?.name}>
            {currentView === 'create' ? 'Create Rule' : 'Save Changes'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Recurrence Manager
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {currentView === 'list' && renderRulesList()}
        {(currentView === 'create' || currentView === 'edit') && renderRuleForm()}
      </CardContent>
    </Card>
  );
}