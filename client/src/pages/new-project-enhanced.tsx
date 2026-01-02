import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Sparkles,
  Clock,
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Smartphone,
  Zap,
  TrendingUp,
  FileText,
  CalendarDays
} from "lucide-react";
import { useLocation } from "wouter";

// Simple form schema
const projectFormSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
  contentType: z.string().min(1, "Please select a content type"),
  channelTypes: z.array(z.string()).min(1, "Please select at least one channel"),
  category: z.string().min(1, "Please select a category"),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { value: 'tiktok', label: 'TikTok', icon: Smartphone, color: 'text-black' },
];

const PROJECT_CONTENT_TYPES = [
  { value: 'fitness', label: 'Fitness', icon: Zap, color: 'text-green-600' },
  { value: 'tech', label: 'Technology', icon: Smartphone, color: 'text-blue-600' },
  { value: 'lifestyle', label: 'Lifestyle', icon: Sparkles, color: 'text-purple-600' },
  { value: 'business', label: 'Business', icon: TrendingUp, color: 'text-orange-600' },
  { value: 'education', label: 'Education', icon: FileText, color: 'text-indigo-600' },
];

const PROJECT_CATEGORIES = {
  fitness: ['Workout Routines', 'Nutrition Tips', 'Mental Health', 'Equipment Reviews'],
  tech: ['Product Reviews', 'Tech News', 'Tutorials', 'Gadget Reviews'],
  lifestyle: ['Daily Routines', 'Home Organization', 'Personal Finance', 'Relationships'],
  business: ['Entrepreneurship', 'Marketing Tips', 'Productivity Hacks', 'Leadership'],
  education: ['Study Tips', 'Online Learning', 'Career Development', 'Skill Building'],
};

export default function NewProjectEnhanced() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      contentType: '',
      channelTypes: [],
      category: '',
    }
  });

  const watchedValues = watch();
  const [activeTab, setActiveTab] = useState('project');
  const [savedProjectBasics, setSavedProjectBasics] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const handleSaveProject = async (formData: ProjectFormData) => {
    setIsSaving(true);
    
    try {
      // Simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSavedProjectBasics(formData);
      
      toast({
        title: "Project Created!",
        description: `"${formData.name}" has been created successfully.`,
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
                <p className="text-sm text-gray-600">Build your content strategy</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Enhanced Workflow
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(handleSaveProject)} className="space-y-6">
              {/* Project Name */}
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  {...register('name')}
                  placeholder="Enter your project name..."
                  className={`mt-2 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe your project..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Content Type */}
              <div>
                <Label>Content Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {PROJECT_CONTENT_TYPES.map((contentType) => {
                    const IconComponent = contentType.icon;
                    const isSelected = watchedValues.contentType === contentType.value;
                    return (
                      <div
                        key={contentType.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setValue('contentType', contentType.value)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <IconComponent className={`h-6 w-6 mb-2 ${contentType.color}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {contentType.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.contentType && (
                  <p className="text-sm text-red-600 mt-1">{errors.contentType.message}</p>
                )}
              </div>

              {/* Platforms */}
              <div>
                <Label>Platforms *</Label>
                <p className="text-sm text-gray-600 mb-3">Select one or more platforms</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {PLATFORMS.map((platform) => {
                    const IconComponent = platform.icon;
                    const isSelected = watchedValues.channelTypes?.includes(platform.value);
                    return (
                      <div
                        key={platform.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const currentChannels = watchedValues.channelTypes || [];
                          const newChannels = isSelected
                            ? currentChannels.filter((c: string) => c !== platform.value)
                            : [...currentChannels, platform.value];
                          setValue('channelTypes', newChannels);
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          <IconComponent className={`h-5 w-5 mb-2 ${platform.color}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {platform.label}
                          </span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-blue-600 mt-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.channelTypes && (
                  <p className="text-sm text-red-600 mt-1">{errors.channelTypes.message}</p>
                )}
              </div>

              {/* Category */}
              {watchedValues.contentType && (
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={watchedValues.category} onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger className={`mt-2 ${errors.category ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_CATEGORIES[watchedValues.contentType as keyof typeof PROJECT_CATEGORIES]?.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation('/trend-analysis')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyze Trends First
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Success Message */}
            {savedProjectBasics && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Project Created Successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Redirecting to dashboard...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}