import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Video, FileText, Camera, Mic, Upload, X, Play } from "lucide-react";

interface ContentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContentCreated?: (content: any) => void;
}

interface ContentFormData {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  tags: string;
  status: 'draft' | 'published' | 'scheduled';
  videoFile?: File;
  thumbnailFile?: File;
}

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: Video },
  { value: 'instagram', label: 'Instagram', icon: Camera },
  { value: 'facebook', label: 'Facebook', icon: Video },
  { value: 'tiktok', label: 'TikTok', icon: Video },
];

const CONTENT_TYPES = [
  { value: 'video', label: 'Video Content', icon: Video },
  { value: 'short', label: 'Short Form Video', icon: Video },
  { value: 'post', label: 'Text Post', icon: FileText },
  { value: 'reel', label: 'Reel/Story', icon: Camera },
  { value: 'podcast', label: 'Audio Content', icon: Mic },
];

export default function ContentCreationModal({ isOpen, onClose, onContentCreated }: ContentCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    platform: '',
    contentType: '',
    tags: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState<Partial<ContentFormData>>({});
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createContentMutation = useMutation({
    mutationFn: async (data: ContentFormData) => {
      setIsUploading(true);
      
      // Process tags properly - convert comma-separated string to array
      const processedTags = data.tags.trim() 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      let videoUrl = null;
      let thumbnailUrl = null;
      
      // Upload video file if present
      if (data.videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('file', data.videoFile);
        videoFormData.append('type', 'video');
        
        try {
          const uploadResponse = await fetch('/api/upload/video', {
            method: 'POST',
            credentials: 'include',
            body: videoFormData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            videoUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.warn('Video upload failed:', uploadError);
        }
      }
      
      // Upload thumbnail file if present
      if (data.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('file', data.thumbnailFile);
        thumbnailFormData.append('type', 'thumbnail');
        
        try {
          const uploadResponse = await fetch('/api/upload/thumbnail', {
            method: 'POST',
            credentials: 'include',
            body: thumbnailFormData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            thumbnailUrl = uploadResult.url;
          }
        } catch (uploadError) {
          console.warn('Thumbnail upload failed:', uploadError);
        }
      }
      
      const response = await apiRequest('POST', '/api/content/create', {
        ...data,
        tags: processedTags,
        videoUrl,
        thumbnailUrl
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setIsUploading(false);
      toast({
        title: "Content Created Successfully!",
        description: `Your ${formData.contentType} for ${formData.platform} has been created.`,
      });
      
      // Invalidate content queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      // Call callback if provided
      onContentCreated?.(data);
      
      // Reset form and close modal
      handleReset();
      onClose();
    },
    onError: (error) => {
      setIsUploading(false);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error Creating Content",
        description: "Failed to create content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<ContentFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.platform) {
      newErrors.platform = 'Platform is required';
    }

    if (!formData.contentType) {
      newErrors.contentType = 'Content type is required';
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

    createContentMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      platform: '',
      contentType: '',
      tags: '',
      status: 'draft'
    });
    setErrors({});
    setVideoPreview(null);
    setThumbnailPreview(null);
    if (videoFileRef.current) videoFileRef.current.value = '';
    if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
  };

  const handleInputChange = (field: keyof ContentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a video file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Video file must be less than 100MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFormData(prev => ({ ...prev, videoFile: file }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file for thumbnail.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Thumbnail file must be less than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFormData(prev => ({ ...prev, thumbnailFile: file }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const removeVideoFile = () => {
    setFormData(prev => ({ ...prev, videoFile: undefined }));
    setVideoPreview(null);
    if (videoFileRef.current) videoFileRef.current.value = '';
  };

  const removeThumbnailFile = () => {
    setFormData(prev => ({ ...prev, thumbnailFile: undefined }));
    setThumbnailPreview(null);
    if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="content-creation-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Create New Content
          </DialogTitle>
          <DialogDescription id="content-creation-description">
            Create new content for social media platforms with detailed information
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
              placeholder="Enter your content title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500">{formData.title.length}/100 characters</p>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-sm font-medium text-gray-700">
              Platform *
            </Label>
            <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
              <SelectTrigger className={errors.platform ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select platform" />
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

          {/* Content Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="contentType" className="text-sm font-medium text-gray-700">
              Content Type *
            </Label>
            <Select value={formData.contentType} onValueChange={(value) => handleInputChange('contentType', value)}>
              <SelectTrigger className={errors.contentType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.contentType && (
              <p className="text-sm text-red-500">{errors.contentType}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your content..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
              maxLength={1000}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500">{formData.description.length}/1000 characters</p>
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
              Tags (comma separated)
            </Label>
            <Input
              id="tags"
              type="text"
              placeholder="e.g. productivity, tech, tutorial"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Add relevant tags to help organize and discover your content
            </p>
          </div>

          {/* Video Upload Section - Show only for video content types */}
          {(formData.contentType === 'video' || formData.contentType === 'short' || formData.contentType === 'reel') && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Files
              </h4>
              
              {/* Video File Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Video File
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoFileRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Video
                  </Button>
                  {formData.videoFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{formData.videoFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeVideoFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                {videoPreview && (
                  <div className="mt-2">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-w-xs h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Thumbnail (Optional)
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailFileRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Choose Thumbnail
                  </Button>
                  {formData.thumbnailFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{formData.thumbnailFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeThumbnailFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <input
                  ref={thumbnailFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                />
                {thumbnailPreview && (
                  <div className="mt-2">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-24 h-16 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Supported formats: MP4, MOV, AVI, WebM (max 100MB). Thumbnail: JPG, PNG (max 10MB)
              </p>
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value: 'draft' | 'published' | 'scheduled') => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={createContentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={createContentMutation.isPending}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={createContentMutation.isPending || isUploading}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {createContentMutation.isPending || isUploading ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Creating...'}
                </div>
              ) : (
                'Create Content'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}