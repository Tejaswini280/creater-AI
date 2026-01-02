import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Layers,
  Video,
  Image,
  FileText,
  Loader2
} from 'lucide-react';

interface Template {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  rating: number;
  downloads: number;
  thumbnailUrl?: string;
  isFeatured: boolean;
  tags?: string[];
  content?: string;
}

const TemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Async operations for template actions
  const { execute: executeUseTemplate, isLoading: isUsingTemplate } = useAsyncOperation(
    async (templateId: number) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Copy to clipboard
      if (template.content) {
        await navigator.clipboard.writeText(template.content);
        
        // Update download count
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { ...t, downloads: t.downloads + 1 } : t
        ));

        return template;
      }
      throw new Error('Template has no content');
    },
    {
      onSuccess: (template) => {
        toast({
          title: "Template Copied!",
          description: `${template.title} has been copied to your clipboard.`,
        });
      },
      errorMessage: "Unable to copy template. Please try again.",
    }
  );

  const { execute: executePreviewTemplate, isLoading: isPreviewingTemplate } = useAsyncOperation(
    async (templateId: number) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      // Open preview in new window
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${template.title} - Preview</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                h2 { color: #666; margin-top: 30px; }
                .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .content { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <h1>${template.title}</h1>
              <div class="meta">
                <strong>Category:</strong> ${template.category}<br>
                <strong>Type:</strong> ${template.type}<br>
                <strong>Rating:</strong> ${template.rating}/5<br>
                <strong>Downloads:</strong> ${template.downloads}
              </div>
              <div class="content">${template.content || 'No content available'}</div>
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
      return template;
    },
    {
      errorMessage: "Failed to preview template. Please try again.",
    }
  );

  const { execute: executeDownloadPack, isLoading: isDownloadingPack } = useAsyncOperation(
    async (packType: string) => {
      // Create a mock pack download
      const packData = {
        youtube: {
          name: "YouTube Starter Pack",
          files: [
            "YouTube_Script_Template.docx",
            "Thumbnail_Template.psd", 
            "Video_Outline.pdf",
            "Analytics_Tracker.xlsx"
          ]
        },
        thumbnails: {
          name: "High-CTR Thumbnails",
          files: [
            "Tech_Thumbnail_Template.psd",
            "Gaming_Thumbnail_Template.psd",
            "Lifestyle_Thumbnail_Template.psd",
            "Tutorial_Thumbnail_Template.psd"
          ]
        },
        scripts: {
          name: "Viral Script Library", 
          files: [
            "Viral_Hook_Scripts.docx",
            "Storytime_Templates.docx",
            "Tutorial_Formats.docx",
            "Product_Review_Scripts.docx"
          ]
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pack = packData[packType as keyof typeof packData];
      
      // Create and download a ZIP file (simulated)
      const packContent = `${pack.name} Contents:\n\n${pack.files.map(file => `• ${file}`).join('\n')}\n\nThank you for downloading from CreatorAI Studio!`;
      
      const blob = new Blob([packContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pack.name.replace(/ /g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return pack;
    },
    {
      onSuccess: (pack) => {
        toast({
          title: "Pack Downloaded!",
          description: `${pack.name} has been downloaded successfully.`,
        });
      },
      errorMessage: "Unable to download pack. Please try again.",
    }
  );

  // Debounced functions
  const debouncedSearch = useDebouncedCallback((term: string) => {
    setSearchTerm(term);
  }, 300);

  const debouncedCategoryChange = useDebouncedCallback((category: string) => {
    setSelectedCategory(category);
  }, 200);

  const templateCategories = [
    { id: 'all', name: 'All Templates' },
    { id: 'video', name: 'Video Templates' },
    { id: 'social', name: 'Social Media Templates' },
    { id: 'thumbnail', name: 'Thumbnail Templates' },
    { id: 'script', name: 'Script Templates' },
    { id: 'branding', name: 'Branding Templates' }
  ];

  // Comprehensive templates data with dummy content
  useEffect(() => {
    const sampleTemplates: Template[] = [
      {
        id: 1,
        title: 'YouTube Video Script Template',
        description: 'Professional video script template with hook, content, and call-to-action structure',
        category: 'video',
        type: 'Video Template',
        rating: 4.8,
        downloads: 1250,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
        isFeatured: true,
        tags: ['youtube', 'script', 'video'],
        content: `# Video Script Template

## Hook (0-15 seconds)
- Start with a compelling question or statement
- Create curiosity or urgency
- Preview the value they'll get

## Introduction (15-30 seconds)
- Introduce yourself briefly
- Set expectations for the video
- Ask viewers to like and subscribe

## Main Content (30 seconds - 8 minutes)
### Point 1: [Main Topic]
- Explanation
- Example or story
- Visual aid description

### Point 2: [Supporting Topic]
- Explanation
- Example or story
- Visual aid description

### Point 3: [Additional Value]
- Explanation
- Example or story
- Visual aid description

## Call to Action (Last 30 seconds)
- Summarize key points
- Ask for engagement (like, comment, subscribe)
- Mention next video or related content
- End with strong closing statement`
      },
      {
        id: 2,
        title: 'Instagram Post Template',
        description: 'Engaging Instagram post template with hashtags and call-to-action',
        category: 'social',
        type: 'Social Media Template',
        rating: 4.6,
        downloads: 890,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
        isFeatured: true,
        tags: ['instagram', 'social', 'post'],
        content: `# Instagram Post Template

## Caption Structure:

**Hook Line:** [Attention-grabbing first line]

**Value/Story:** [2-3 sentences providing value or telling a story]

**Call to Action:** [Ask a question or encourage engagement]

**Hashtags:** 
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
#hashtag6 #hashtag7 #hashtag8 #hashtag9 #hashtag10

## Example:
🔥 This simple trick changed everything for me!

I used to struggle with [problem] until I discovered [solution]. Now I [result/benefit]. The best part? It only takes 5 minutes a day!

What's your biggest challenge with [topic]? Drop it in the comments! 👇

#productivity #tips #success #motivation #lifestyle
#entrepreneur #mindset #goals #inspiration #growth`
      },
      {
        id: 3,
        title: 'YouTube Thumbnail Template',
        description: 'High-converting thumbnail design template with text overlay guidelines',
        category: 'thumbnail',
        type: 'Thumbnail Template',
        rating: 4.9,
        downloads: 2100,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
        isFeatured: true,
        tags: ['thumbnail', 'youtube', 'design'],
        content: `# YouTube Thumbnail Template Guide

## Design Specifications:
- **Size:** 1280 x 720 pixels (16:9 aspect ratio)
- **File format:** JPG, GIF, or PNG
- **File size:** Under 2MB
- **Minimum width:** 640 pixels

## Design Elements:

### 1. Background
- Use bright, contrasting colors
- Avoid cluttered backgrounds
- Consider gradient overlays

### 2. Text Overlay
- **Font:** Bold, easy-to-read fonts
- **Size:** Large enough to read on mobile
- **Color:** High contrast with background
- **Maximum:** 6-8 words

### 3. Face/Person
- Show clear facial expressions
- Use close-up shots
- Express emotion (surprise, excitement, etc.)
- Position face on left or right third

### 4. Visual Elements
- Use arrows, circles, or highlights
- Add relevant icons or symbols
- Include brand colors
- Maintain consistent style

## Best Practices:
✅ Test readability on mobile devices
✅ Use consistent branding
✅ Create curiosity without clickbait
✅ A/B test different versions
✅ Analyze competitor thumbnails

## Tools Recommended:
- Canva
- Photoshop
- GIMP (free)
- Figma`
      },
      {
        id: 4,
        title: 'Product Launch Script',
        description: 'Complete script template for product launches and announcements',
        category: 'script',
        type: 'Script Template',
        rating: 4.7,
        downloads: 650,
        thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        isFeatured: false,
        tags: ['product', 'launch', 'script'],
        content: `# Product Launch Script Template

## Pre-Launch Tease (1-2 weeks before)
"Something big is coming... 👀 
We've been working on this for [time period] and can't wait to share it with you. 
Any guesses what it could be? 🤔"

## Launch Day Announcement
"🚀 IT'S HERE! 

Introducing [Product Name] - the [brief description] you've been waiting for!

✨ What makes it special:
• [Feature 1]
• [Feature 2] 
• [Feature 3]

🎯 Perfect for: [Target audience]

💰 Special launch price: [Price] (normally [Regular price])
⏰ Limited time: [Duration]

🔗 Get yours now: [Link]

Questions? Drop them below! 👇"

## Follow-up Posts (Days 2-7)

### Day 2: Social Proof
"The response has been incredible! 🙌
Here's what [Customer name] said: '[Testimonial]'
Still thinking about it? [Link]"

### Day 3: Behind the Scenes
"Want to see how [Product] was made? 
Here's a behind-the-scenes look at our process... [Story/Video]"

### Day 5: FAQ
"Getting lots of great questions! Here are the top 3:
Q: [Question 1]
A: [Answer 1]
[Continue with Q&A]"

### Day 7: Last Chance
"⏰ FINAL HOURS! 
Launch pricing ends at midnight tonight.
Don't miss out: [Link]"`
      },
      {
        id: 5,
        title: 'Brand Style Guide Template',
        description: 'Comprehensive brand style guide template for consistent branding',
        category: 'branding',
        type: 'Branding Template',
        rating: 4.5,
        downloads: 420,
        thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
        isFeatured: false,
        tags: ['branding', 'style', 'guide'],
        content: `# Brand Style Guide Template

## 1. Brand Overview
**Mission:** [Your brand mission statement]
**Vision:** [Your brand vision]
**Values:** [Core brand values]
**Personality:** [Brand personality traits]

## 2. Logo Guidelines
**Primary Logo:** [Description and usage]
**Secondary Logo:** [Alternative versions]
**Minimum Size:** [Smallest acceptable size]
**Clear Space:** [Required spacing around logo]
**Don'ts:** [What not to do with logo]

## 3. Color Palette
**Primary Colors:**
- Color 1: [Hex code] [RGB] [CMYK]
- Color 2: [Hex code] [RGB] [CMYK]

**Secondary Colors:**
- Color 3: [Hex code] [RGB] [CMYK]
- Color 4: [Hex code] [RGB] [CMYK]

**Neutral Colors:**
- White: #FFFFFF
- Black: #000000
- Gray: [Hex code]

## 4. Typography
**Primary Font:** [Font name]
- Headings: [Font weight/style]
- Body text: [Font weight/style]

**Secondary Font:** [Font name]
- Usage: [When to use]

**Web Fonts:** [Google Fonts or other web fonts]

## 5. Voice & Tone
**Brand Voice:** [Consistent personality]
**Tone Variations:**
- Professional: [Description]
- Casual: [Description]
- Educational: [Description]

## 6. Imagery Style
**Photography Style:** [Description]
**Illustration Style:** [Description]
**Icon Style:** [Description]
**Filters/Effects:** [Specific treatments]

## 7. Social Media Guidelines
**Profile Picture:** [Logo version to use]
**Cover Images:** [Style and content guidelines]
**Post Templates:** [Consistent layouts]
**Hashtag Strategy:** [Brand hashtags]`
      }
    ];

    setTemplates(sampleTemplates);
  }, []);

  const handleUseTemplate = useCallback(async (templateId: number) => {
    await executeUseTemplate(templateId);
  }, [executeUseTemplate]);

  const handlePreviewTemplate = useCallback(async (templateId: number) => {
    await executePreviewTemplate(templateId);
  }, [executePreviewTemplate]);

  const handleDownloadPack = useCallback(async (packType: string) => {
    await executeDownloadPack(packType);
  }, [executeDownloadPack]);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTemplateIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video template':
        return <Video className="w-3 h-3" />;
      case 'thumbnail template':
        return <Image className="w-3 h-3" />;
      case 'script template':
        return <FileText className="w-3 h-3" />;
      default:
        return <Layers className="w-3 h-3" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (isUsingTemplate || isPreviewingTemplate || isDownloadingPack) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {isUsingTemplate && 'Copying template...'}
            {isPreviewingTemplate && 'Opening preview...'}
            {isDownloadingPack && 'Downloading pack...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Layers className="w-8 h-8 mr-3 text-primary" />
            Template Library
          </h1>
          <p className="text-gray-600">Ready-to-use templates for videos, thumbnails, scripts, and branding</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                  aria-label="Search templates"
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={selectedCategory} onValueChange={debouncedCategoryChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templateCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <Tabs value={selectedCategory} onValueChange={debouncedCategoryChange} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-2xl">
            {templateCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-sm">
                {category.name.replace(" Templates", "")}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="bg-white shadow-sm hover:shadow-md transition-shadow group">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={template.thumbnailUrl}
                      alt={template.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-gray-800 flex items-center space-x-1">
                        {getTemplateIcon(template.type)}
                        <span className="text-xs">{template.type}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-lg">{template.title}</h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        {renderStars(template.rating)}
                        <span className="text-sm text-gray-600 ml-2">{template.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {template.downloads.toLocaleString()} downloads
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => handleUseTemplate(template.id)}
                        disabled={isUsingTemplate}
                        aria-label={`Use template: ${template.title}`}
                      >
                        {isUsingTemplate ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        {isUsingTemplate ? "Copying..." : "Use Template"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template.id)}
                        disabled={isPreviewingTemplate}
                        aria-label={`Preview template: ${template.title}`}
                      >
                        {isPreviewingTemplate ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Featured Collections */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">YouTube Starter Pack</h3>
                    <p className="text-sm text-blue-700">Everything you need to start</p>
                  </div>
                </div>
                <p className="text-blue-800 text-sm mb-4">
                  Complete collection of video templates, thumbnails, and scripts for new YouTubers.
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleDownloadPack('youtube')}
                  disabled={isDownloadingPack}
                  aria-label="Download YouTube Starter Pack"
                >
                  {isDownloadingPack ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Pack
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">High-CTR Thumbnails</h3>
                    <p className="text-sm text-purple-700">Boost your click rates</p>
                  </div>
                </div>
                <p className="text-purple-800 text-sm mb-4">
                  Proven thumbnail designs that increase click-through rates by up to 40%.
                </p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleDownloadPack('thumbnails')}
                  disabled={isDownloadingPack}
                  aria-label="Download High-CTR Thumbnails Pack"
                >
                  {isDownloadingPack ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Pack
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Viral Script Library</h3>
                    <p className="text-sm text-green-700">Proven viral formats</p>
                  </div>
                </div>
                <p className="text-green-800 text-sm mb-4">
                  Script templates used by creators with millions of views and subscribers.
                </p>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleDownloadPack('scripts')}
                  disabled={isDownloadingPack}
                  aria-label="Download Viral Script Library Pack"
                >
                  {isDownloadingPack ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Pack
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;