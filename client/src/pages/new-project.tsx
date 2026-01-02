import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Video, 
  Image, 
  Mic, 
  FileText, 
  Plus, 
  Sparkles, 
  Clock, 
  Users, 
  Target,
  TrendingUp,
  Palette,
  Zap,
  ArrowRight,
  FolderOpen,
  Settings,
  Calendar,
  Loader2,
  Upload,
  Cloud,
  X,
  Play,
  Bot
} from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
}

interface ProjectForm {
  name: string;
  description: string;
  type: string;
  template: string;
  platform: string;
  targetAudience: string;
  estimatedDuration: string;
  tags: string[];
  isPublic: boolean;
  collaborators: string[];
}

const PROJECT_TYPES = [
  { value: 'video', label: 'Video Content', icon: Video, color: 'text-blue-600' },
  { value: 'audio', label: 'Audio Content', icon: Mic, color: 'text-purple-600' },
  { value: 'image', label: 'Image Content', icon: Image, color: 'text-green-600' },
  { value: 'script', label: 'Script Writing', icon: FileText, color: 'text-orange-600' },
  { value: 'campaign', label: 'Marketing Campaign', icon: Target, color: 'text-red-600' },
];

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', color: 'text-red-600' },
  { value: 'instagram', label: 'Instagram', color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', color: 'text-blue-700' },
  { value: 'tiktok', label: 'TikTok', color: 'text-black' },
  { value: 'twitter', label: 'Twitter', color: 'text-blue-400' },
];

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'youtube-short',
    name: 'YouTube Short',
    description: 'Create engaging vertical videos under 60 seconds',
    icon: Video,
    category: 'video',
    estimatedTime: '2-4 hours',
    difficulty: 'Beginner',
    tags: ['short-form', 'vertical', 'trending']
  },
  {
    id: 'podcast-episode',
    name: 'Podcast Episode',
    description: 'Record and edit a professional podcast episode',
    icon: Mic,
    category: 'audio',
    estimatedTime: '4-6 hours',
    difficulty: 'Intermediate',
    tags: ['podcast', 'audio', 'long-form']
  },
  {
    id: 'social-post',
    name: 'Social Media Post',
    description: 'Design eye-catching social media graphics',
    icon: Image,
    category: 'image',
    estimatedTime: '1-2 hours',
    difficulty: 'Beginner',
    tags: ['social', 'graphic', 'branding']
  },
  {
    id: 'video-script',
    name: 'Video Script',
    description: 'Write compelling video scripts with AI assistance',
    icon: FileText,
    category: 'script',
    estimatedTime: '2-3 hours',
    difficulty: 'Beginner',
    tags: ['script', 'ai', 'storytelling']
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Plan and execute a multi-platform campaign',
    icon: Target,
    category: 'campaign',
    estimatedTime: '8-12 hours',
    difficulty: 'Advanced',
    tags: ['campaign', 'strategy', 'multi-platform']
  },
  {
    id: 'tutorial-video',
    name: 'Tutorial Video',
    description: 'Create educational how-to content',
    icon: Video,
    category: 'video',
    estimatedTime: '3-5 hours',
    difficulty: 'Intermediate',
    tags: ['tutorial', 'educational', 'how-to']
  }
];

export default function NewProject() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: '',
    description: '',
    type: '',
    template: '',
    platform: '',
    targetAudience: '',
    estimatedDuration: '',
    tags: [],
    isPublic: false,
    collaborators: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setProjectForm(prev => ({
      ...prev,
      type: template.category,
      template: template.id,
      estimatedDuration: template.estimatedTime
    }));
  };

  const handleInputChange = (field: keyof ProjectForm, value: any) => {
    setProjectForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTagInput = (tag: string) => {
    if (tag && !projectForm.tags.includes(tag)) {
      setProjectForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectForm(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const handleStartRecording = () => {
    setShowModal(false);
    setLocation('/recorder');
  };

  const handleUploadFromDevice = () => {
    setShowModal(false);
    setLocation('/content-studio');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Store the uploaded file in localStorage for the editor
    const fileData = {
      id: Date.now(),
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      data: URL.createObjectURL(file)
    };
    
    localStorage.setItem('uploadedFile', JSON.stringify(fileData));
    
    toast({
      title: "File Uploaded!",
      description: `${file.name} has been uploaded and is ready for editing.`,
    });
    
    handleUploadFromDevice();
  };

  const handleCreateProject = async () => {
    if (!projectForm.name || !projectForm.type) {
      toast({
        title: "Missing Information",
        description: "Please fill in the project name and select a type.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Check authentication status
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('Auth check:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        token: token ? token.substring(0, 20) + '...' : 'none',
        user: user ? JSON.parse(user) : 'none'
      });

      if (!token || !user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create projects. Using development mode...",
          variant: "destructive",
        });
        
        // For development, use a test token
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }));
      }

      // Prepare project data for API
      const projectData = {
        name: projectForm.name,
        description: projectForm.description,
        type: projectForm.type,
        template: projectForm.template,
        platform: projectForm.platform,
        targetAudience: projectForm.targetAudience,
        estimatedDuration: projectForm.estimatedDuration,
        tags: projectForm.tags,
        isPublic: projectForm.isPublic,
        metadata: {
          selectedTemplate: selectedTemplate?.name || null,
          templateId: selectedTemplate?.id || null
        }
      };

      console.log('Attempting to create project with data:', projectData);

      let createdProject;
      let success = false;

      // Try to call the API first
      try {
        console.log('Making API request to /api/projects...');
        const response = await apiRequest('POST', '/api/projects', projectData);
        
        console.log('API response received:', response);
        
        if (response.ok) {
          const result = await response.json();
          createdProject = result.project;
          success = true;
          console.log('Project created via API:', createdProject);
        } else {
          const errorText = await response.text();
          console.error('API request failed:', response.status, errorText);
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
      } catch (apiError) {
        console.log('API not available, using localStorage fallback:', apiError);
        
        // Fallback to localStorage
        const fallbackProject = {
          id: Date.now(), // Simple ID generation
          ...projectData,
          userId: 'local-user',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Store in localStorage
        const existingProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
        existingProjects.push(fallbackProject);
        localStorage.setItem('localProjects', JSON.stringify(existingProjects));
        
        createdProject = fallbackProject;
        success = true;
        console.log('Project created via localStorage:', createdProject);
      }

      if (success && createdProject) {
        toast({
          title: "Project Created!",
          description: `"${projectForm.name}" has been created successfully.`,
        });

        // Store the created project ID for potential future use
        const createdProjectId = createdProject.id;
        console.log('Project created successfully with ID:', createdProjectId);

        // Redirect to the appropriate workspace based on project type
        switch (projectForm.type) {
          case 'video':
            setLocation('/content-studio');
            break;
          case 'audio':
            setLocation('/recorder');
            break;
          case 'image':
            setLocation('/content-studio');
            break;
          case 'script':
            setLocation('/ai');
            break;
          case 'campaign':
            setLocation('/content-studio');
            break;
          default:
            setLocation('/content-studio');
        }
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Project Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project creator...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600">Start building your next great content project</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Let's make a video!</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  Advanced
                </button>
                <button
                  onClick={() => setLocation('/')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Upload Files Section */}
              <div className="mb-8">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Cloud className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload files</h3>
                  <p className="text-gray-600 mb-4">Choose files or drag them here</p>
                  
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="video/*,audio/*,image/*"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </label>
                </div>
              </div>

              {/* Creation Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start by Recording */}
                <div
                  className="p-6 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                  onClick={handleStartRecording}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Start by recording</h3>
                      <p className="text-sm text-gray-600">Record video, audio, or screen</p>
                    </div>
                  </div>
                </div>

                {/* Start with AI */}
                <div
                  className="p-6 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all"
                  onClick={handleUploadFromDevice}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Start with AI</h3>
                      <p className="text-sm text-gray-600">AI-powered content creation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Form (Hidden by default) */}
      {!showModal && (
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Basics */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    Project Basics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={projectForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your project name..."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      value={projectForm.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your project..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="project-type">Project Type *</Label>
                      <Select value={projectForm.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES.map((type) => {
                            const IconComponent = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className={`h-4 w-4 ${type.color}`} />
                                  {type.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="platform">Primary Platform</Label>
                      <Select value={projectForm.platform} onValueChange={(value) => handleInputChange('platform', value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORMS.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${platform.color}`}>
                                  {platform.label}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Templates */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Project Templates
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose from our curated templates or start from scratch
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PROJECT_TEMPLATES.map((template) => {
                      const IconComponent = template.icon;
                      const isSelected = selectedTemplate?.id === template.id;
                      
                      return (
                        <div
                          key={template.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <IconComponent className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {template.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {template.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {template.estimatedTime}
                                </Badge>
                                <Badge 
                                  variant={template.difficulty === 'Beginner' ? 'default' : 
                                           template.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {template.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-600" />
                      Advanced Options
                    </CardTitle>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm"
                    >
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </Button>
                  </div>
                </CardHeader>
                {showAdvanced && (
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="target-audience">Target Audience</Label>
                      <Input
                        id="target-audience"
                        value={projectForm.targetAudience}
                        onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                        placeholder="e.g., Young professionals, 25-35 years old"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimated-duration">Estimated Duration</Label>
                      <Input
                        id="estimated-duration"
                        value={projectForm.estimatedDuration}
                        onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                        placeholder="e.g., 2-4 hours"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const target = e.target as HTMLInputElement;
                                handleTagInput(target.value);
                                target.value = '';
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById('tags') as HTMLInputElement;
                              if (input?.value) {
                                handleTagInput(input.value);
                                input.value = '';
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {projectForm.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {projectForm.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="cursor-pointer hover:bg-red-100"
                                onClick={() => removeTag(tag)}
                              >
                                {tag} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is-public"
                        checked={projectForm.isPublic}
                        onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                      />
                      <Label htmlFor="is-public">Make this project public</Label>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Summary */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projectForm.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="text-sm font-medium text-gray-900">{projectForm.name}</span>
                    </div>
                  )}
                  
                  {projectForm.type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Type</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{projectForm.type}</span>
                    </div>
                  )}
                  
                  {projectForm.platform && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Platform</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{projectForm.platform}</span>
                    </div>
                  )}
                  
                  {selectedTemplate && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Template</span>
                        <span className="text-sm font-medium text-gray-900">{selectedTemplate.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Difficulty</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedTemplate.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Time Estimate</span>
                        <span className="text-sm font-medium text-gray-900">{selectedTemplate.estimatedTime}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleCreateProject}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!projectForm.name || !projectForm.type || isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/content-studio')}
                    className="w-full"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open Workspace
                  </Button>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Project Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-800 space-y-2">
                  <p>• Start with a clear project goal</p>
                  <p>• Use templates to save time</p>
                  <p>• Set realistic timelines</p>
                  <p>• Consider your target audience</p>
                  <p>• Plan your content strategy</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
