import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Star, 
  Copy, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  Eye,
  Heart,
  X
} from 'lucide-react';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  contentType: 'post' | 'story' | 'video' | 'reel' | 'article';
  platforms: string[];
  titleTemplate: string;
  descriptionTemplate: string;
  hashtags: string[];
  mediaType?: 'image' | 'video' | 'carousel';
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
  targetAudience: string;
  estimatedEngagement: number;
  usageCount: number;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  performance?: {
    avgViews: number;
    avgEngagement: number;
    avgReach: number;
    successRate: number;
  };
}

interface TemplateLibraryProps {
  onTemplateSelect?: (template: ContentTemplate) => void;
  onTemplateCreate?: (template: ContentTemplate) => void;
  onClose?: () => void;
}

export default function TemplateLibrary({ 
  onTemplateSelect, 
  onTemplateCreate, 
  onClose 
}: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'engagement' | 'recent'>('recent');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentView, setCurrentView] = useState<'library' | 'create' | 'edit'>('library');
  const [editingTemplate, setEditingTemplate] = useState<ContentTemplate | null>(null);

  const categories = [
    'Marketing',
    'Educational',
    'Entertainment',
    'Product',
    'Behind the Scenes',
    'User Generated',
    'Seasonal',
    'Promotional'
  ];

  const platforms = [
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-400' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black' }
  ];

  // Sample data - replace with API call
  useEffect(() => {
    const sampleTemplates: ContentTemplate[] = [
      {
        id: '1',
        name: 'Daily Motivation Quote',
        description: 'Inspirational quotes with branded background',
        category: 'Marketing',
        contentType: 'post',
        platforms: ['instagram', 'facebook', 'linkedin'],
        titleTemplate: 'Monday Motivation: {quote}',
        descriptionTemplate: 'Start your week with this powerful reminder: {quote}\n\nWhat motivates you this Monday? Share in the comments! 👇\n\n{hashtags}',
        hashtags: ['#MondayMotivation', '#Inspiration', '#Mindset', '#Success'],
        mediaType: 'image',
        tone: 'professional',
        targetAudience: 'Professionals and entrepreneurs',
        estimatedEngagement: 8.5,
        usageCount: 45,
        isPublic: true,
        isFavorite: true,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-20'),
        author: 'Content Team',
        tags: ['motivation', 'quotes', 'monday'],
        performance: {
          avgViews: 2500,
          avgEngagement: 8.5,
          avgReach: 1800,
          successRate: 92
        }
      },
      {
        id: '2',
        name: 'Product Feature Highlight',
        description: 'Showcase specific product features with benefits',
        category: 'Product',
        contentType: 'video',
        platforms: ['youtube', 'instagram', 'linkedin'],
        titleTemplate: 'Feature Spotlight: {feature_name}',
        descriptionTemplate: '🚀 Introducing {feature_name}!\n\n✨ What it does: {feature_description}\n💡 Why you\'ll love it: {benefit}\n🎯 Perfect for: {use_case}\n\nTry it now and let us know what you think!\n\n{hashtags}',
        hashtags: ['#ProductUpdate', '#NewFeature', '#Innovation', '#TechTips'],
        mediaType: 'video',
        tone: 'professional',
        targetAudience: 'Existing customers and prospects',
        estimatedEngagement: 12.3,
        usageCount: 28,
        isPublic: true,
        isFavorite: false,
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-12-18'),
        author: 'Product Team',
        tags: ['product', 'features', 'demo'],
        performance: {
          avgViews: 4200,
          avgEngagement: 12.3,
          avgReach: 3100,
          successRate: 88
        }
      },
      {
        id: '3',
        name: 'Behind the Scenes Story',
        description: 'Show your team and company culture',
        category: 'Behind the Scenes',
        contentType: 'story',
        platforms: ['instagram', 'facebook'],
        titleTemplate: 'Behind the Scenes: {activity}',
        descriptionTemplate: 'Take a peek behind the curtain! 👀\n\nToday we\'re {activity} and wanted to share the process with you.\n\n{team_member} says: "{quote}"\n\nWhat would you like to see more of? 🤔\n\n{hashtags}',
        hashtags: ['#BehindTheScenes', '#TeamWork', '#Culture', '#Process'],
        mediaType: 'video',
        tone: 'casual',
        targetAudience: 'Community and followers',
        estimatedEngagement: 15.7,
        usageCount: 67,
        isPublic: true,
        isFavorite: true,
        createdAt: new Date('2024-10-20'),
        updatedAt: new Date('2024-12-22'),
        author: 'Social Media Team',
        tags: ['behind-scenes', 'team', 'culture'],
        performance: {
          avgViews: 1800,
          avgEngagement: 15.7,
          avgReach: 1200,
          successRate: 95
        }
      },
      {
        id: '4',
        name: 'Educational Tutorial',
        description: 'Step-by-step tutorials and how-to content',
        category: 'Educational',
        contentType: 'video',
        platforms: ['youtube', 'linkedin', 'tiktok'],
        titleTemplate: 'How to {skill} in {time_frame}',
        descriptionTemplate: '📚 Learn {skill} with this step-by-step guide!\n\n🎯 What you\'ll learn:\n• {point_1}\n• {point_2}\n• {point_3}\n\n⏱️ Time needed: {time_frame}\n🎓 Skill level: {difficulty}\n\nSave this post for later and tag someone who needs to see this! 🔖\n\n{hashtags}',
        hashtags: ['#Tutorial', '#Learning', '#HowTo', '#Education', '#Skills'],
        mediaType: 'video',
        tone: 'friendly',
        targetAudience: 'Learners and students',
        estimatedEngagement: 18.2,
        usageCount: 34,
        isPublic: true,
        isFavorite: false,
        createdAt: new Date('2024-11-30'),
        updatedAt: new Date('2024-12-15'),
        author: 'Education Team',
        tags: ['tutorial', 'education', 'how-to'],
        performance: {
          avgViews: 5600,
          avgEngagement: 18.2,
          avgReach: 4200,
          successRate: 91
        }
      },
      {
        id: '5',
        name: 'User Generated Content',
        description: 'Showcase customer stories and testimonials',
        category: 'User Generated',
        contentType: 'post',
        platforms: ['instagram', 'facebook', 'linkedin'],
        titleTemplate: 'Customer Spotlight: {customer_name}',
        descriptionTemplate: '⭐ Customer Spotlight! ⭐\n\nMeet {customer_name}, who {achievement}!\n\n💬 "{testimonial}"\n\nThank you for trusting us with your {goal}. Stories like this inspire us every day! 🙏\n\n{hashtags}',
        hashtags: ['#CustomerSpotlight', '#Testimonial', '#Success', '#Community'],
        mediaType: 'image',
        tone: 'friendly',
        targetAudience: 'Prospects and community',
        estimatedEngagement: 14.8,
        usageCount: 52,
        isPublic: true,
        isFavorite: true,
        createdAt: new Date('2024-09-10'),
        updatedAt: new Date('2024-12-10'),
        author: 'Customer Success',
        tags: ['ugc', 'testimonial', 'customer'],
        performance: {
          avgViews: 3200,
          avgEngagement: 14.8,
          avgReach: 2400,
          successRate: 89
        }
      }
    ];
    setTemplates(sampleTemplates);
    setFilteredTemplates(sampleTemplates);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Content type filter
    if (selectedContentType !== 'all') {
      filtered = filtered.filter(template => template.contentType === selectedContentType);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'engagement':
          return b.estimatedEngagement - a.estimatedEngagement;
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedContentType, showFavoritesOnly, sortBy]);

  const toggleFavorite = (templateId: string) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ));
  };

  const duplicateTemplate = (template: ContentTemplate) => {
    const newTemplate: ContentTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const deleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(template => template.id !== templateId));
    }
  };

  const createNewTemplate = (): ContentTemplate => ({
    id: `template-${Date.now()}`,
    name: '',
    description: '',
    category: 'Marketing',
    contentType: 'post',
    platforms: [],
    titleTemplate: '',
    descriptionTemplate: '',
    hashtags: [],
    tone: 'professional',
    targetAudience: '',
    estimatedEngagement: 0,
    usageCount: 0,
    isPublic: false,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'You',
    tags: []
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(createNewTemplate());
    setCurrentView('create');
  };

  const handleEditTemplate = (template: ContentTemplate) => {
    setEditingTemplate({ ...template });
    setCurrentView('edit');
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;

    if (currentView === 'create') {
      setTemplates(prev => [...prev, editingTemplate]);
      onTemplateCreate?.(editingTemplate);
    } else {
      setTemplates(prev => prev.map(template =>
        template.id === editingTemplate.id ? editingTemplate : template
      ));
    }

    setEditingTemplate(null);
    setCurrentView('library');
  };

  const renderTemplateCard = (template: ContentTemplate) => (
    <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{template.name}</h4>
              <Badge variant="outline" className="text-xs">
                {template.contentType}
              </Badge>
              {template.isPublic && (
                <Badge variant="secondary" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
            <div className="flex items-center gap-1 mb-2">
              {template.platforms.slice(0, 3).map(platformId => {
                const platform = platforms.find(p => p.id === platformId);
                return platform ? (
                  <div
                    key={platformId}
                    className={`w-4 h-4 rounded ${platform.color}`}
                    title={platform.name}
                  />
                ) : null;
              })}
              {template.platforms.length > 3 && (
                <span className="text-xs text-gray-400">+{template.platforms.length - 3}</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(template.id);
            }}
          >
            <Heart className={`w-4 h-4 ${template.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {template.hashtags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.hashtags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.hashtags.length - 3}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
          <div className="text-center">
            <div className="font-medium">{template.usageCount}</div>
            <div>Uses</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{template.estimatedEngagement}%</div>
            <div>Engagement</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{template.performance?.successRate || 0}%</div>
            <div>Success</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTemplateSelect?.(template);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                duplicateTemplate(template);
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditTemplate(template);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteTemplate(template.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Badge className="text-xs bg-gray-100 text-gray-600">
            {template.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderLibraryView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Template Library</h3>
          <p className="text-gray-600">Choose from pre-built content templates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedContentType} onValueChange={setSelectedContentType}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="post">Post</SelectItem>
            <SelectItem value="story">Story</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="reel">Reel</SelectItem>
            <SelectItem value="article">Article</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="usage">Usage</SelectItem>
            <SelectItem value="engagement">Engagement</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Star className="w-4 h-4 mr-1" />
          Favorites
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.map(renderTemplateCard)}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-semibold mb-2">No templates found</h4>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all' || selectedContentType !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first template to get started'
            }
          </p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}
    </div>
  );

  const renderTemplateForm = () => {
    if (!editingTemplate) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {currentView === 'create' ? 'Create Template' : 'Edit Template'}
            </h3>
            <p className="text-gray-600">Design a reusable content template</p>
          </div>
          <Button variant="ghost" onClick={() => setCurrentView('library')}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Basic Information</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Daily Motivation Quote"
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description of this template"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingTemplate.category}
                    onValueChange={(value) => setEditingTemplate(prev => prev ? { ...prev, category: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select
                    value={editingTemplate.contentType}
                    onValueChange={(value: any) => setEditingTemplate(prev => prev ? { ...prev, contentType: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Content Templates */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Content Templates</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title-template">Title Template</Label>
                <Input
                  id="title-template"
                  value={editingTemplate.titleTemplate}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, titleTemplate: e.target.value } : null)}
                  placeholder="e.g., Monday Motivation: {quote}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{variable}'} for dynamic content
                </p>
              </div>
              
              <div>
                <Label htmlFor="description-template">Description Template</Label>
                <Textarea
                  id="description-template"
                  value={editingTemplate.descriptionTemplate}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, descriptionTemplate: e.target.value } : null)}
                  placeholder="Template for post description..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="hashtags">Default Hashtags</Label>
                <Input
                  id="hashtags"
                  value={editingTemplate.hashtags.join(' ')}
                  onChange={(e) => setEditingTemplate(prev => prev ? { 
                    ...prev, 
                    hashtags: e.target.value.split(' ').filter(tag => tag.trim()) 
                  } : null)}
                  placeholder="#hashtag1 #hashtag2 #hashtag3"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Platform Selection */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Target Platforms</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map(platform => (
              <div
                key={platform.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  editingTemplate.platforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  const isSelected = editingTemplate.platforms.includes(platform.id);
                  setEditingTemplate(prev => prev ? {
                    ...prev,
                    platforms: isSelected
                      ? prev.platforms.filter(p => p !== platform.id)
                      : [...prev.platforms, platform.id]
                  } : null);
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

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentView('library')}>
            Cancel
          </Button>
          <Button onClick={handleSaveTemplate} disabled={!editingTemplate.name}>
            {currentView === 'create' ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Library
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {currentView === 'library' && renderLibraryView()}
        {(currentView === 'create' || currentView === 'edit') && renderTemplateForm()}
      </CardContent>
    </Card>
  );
}