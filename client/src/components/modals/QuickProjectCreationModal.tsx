import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Loader2, Check } from "lucide-react";

interface QuickProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const contentTypes = [
  { id: 'social-media', label: 'Social Media', description: 'Posts, stories, reels' },
  { id: 'blog', label: 'Blog', description: 'Articles, newsletters' },
  { id: 'video', label: 'Video', description: 'YouTube, TikTok, shorts' },
  { id: 'marketing', label: 'Marketing', description: 'Campaigns, ads' },
];

const categories = [
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '✨' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
];

const platforms = [
  { id: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'youtube', label: 'YouTube', color: 'bg-red-600' },
  { id: 'twitter', label: 'Twitter', color: 'bg-black' },
];

export default function QuickProjectCreationModal({ isOpen, onClose }: QuickProjectCreationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contentType: '',
    category: '',
    platforms: [] as string[],
    targetAudience: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.contentType) {
      newErrors.contentType = 'Please select a content type';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = 'Please select at least one platform';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create project with smart defaults
      const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const project = {
        id: projectId,
        name: formData.name,
        description: formData.description || `${formData.contentType} project for ${formData.category}`,
        contentType: formData.contentType,
        category: formData.category,
        platforms: formData.platforms,
        targetAudience: formData.targetAudience || 'General audience',
        
        // Smart defaults
        contentFormats: ['posts', 'images', 'stories'],
        postingFrequency: 'daily',
        brandVoice: 'professional-friendly',
        aiTools: ['content-generator', 'image-creator', 'hashtag-optimizer'],
        autoSchedule: true,
        timeline: '3-months',
        preferredTimes: ['09:00', '15:00', '18:00'],
        
        // Metadata
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'project',
        tags: [formData.category, ...formData.platforms],
      };

      // Store in localStorage
      const existingProjects = JSON.parse(localStorage.getItem('localProjects') || '[]');
      const updatedProjects = [project, ...existingProjects];
      localStorage.setItem('localProjects', JSON.stringify(updatedProjects));
      
      // Store as latest created project
      localStorage.setItem('latestCreatedProject', JSON.stringify(project));
      localStorage.setItem('currentProjectId', projectId);

      // Show success message
      toast({
        title: "Project Created Successfully!",
        description: `"${formData.name}" has been created and you'll be redirected to project details.`,
      });

      // Trigger refresh event for dashboard
      window.dispatchEvent(new CustomEvent('refreshDashboardProjects'));

      // Close modal
      onClose();

      // Reset form
      setFormData({
        name: '',
        description: '',
        contentType: '',
        category: '',
        platforms: [],
        targetAudience: '',
      });

      // Redirect to project details page
      setTimeout(() => {
        window.location.href = `/project-details?id=${projectId}`;
      }, 500);

    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error Creating Project",
        description: "There was an error creating your project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create New Project</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Create a new project with smart defaults. You can customize advanced settings later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Fitness Instagram Campaign"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your project goals..."
              rows={3}
            />
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label>Content Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contentType: type.id }))}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.contentType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
            {errors.contentType && <p className="text-sm text-red-500">{errors.contentType}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    formData.category === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{category.emoji}</div>
                  <div className="font-medium text-sm">{category.label}</div>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label>Platforms *</Label>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => handlePlatformToggle(platform.id)}
                  className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                    formData.platforms.includes(platform.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 ${platform.color} rounded flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">
                      {platform.label.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium">{platform.label}</span>
                  {formData.platforms.includes(platform.id) && (
                    <Check className="h-4 w-4 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
            {errors.platforms && <p className="text-sm text-red-500">{errors.platforms}</p>}
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="e.g., Young professionals, fitness enthusiasts..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}