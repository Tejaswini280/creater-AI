import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { 
  Sparkles, 
  Calendar, 
  Target, 
  Hash, 
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { aiContentApi } from '@/lib/socialMediaApi';
import { enhancedContentApi } from '../../services/enhancedContentApi';

interface EnhancedProjectFormProps {
  onProjectCreate: (project: any) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  channel: string;
  contentType: string;
  title: string;
  description: string;
  duration: '1week' | '15days' | '30days' | 'custom';
  customDuration?: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  tags: string[];
  isPublic: boolean;
}

const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'facebook', label: 'Facebook', icon: '📘', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-gradient-to-r from-blue-600 to-blue-700' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-gradient-to-r from-black to-gray-800' },
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'bg-gradient-to-r from-red-500 to-red-600' },
  { value: 'twitter', label: 'Twitter', icon: '🐦', color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌', color: 'bg-gradient-to-r from-red-500 to-pink-500' }
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'fitness', label: 'Fitness', icon: '💪', description: 'Workout routines, nutrition tips, fitness motivation' },
  { value: 'tech', label: 'Technology', icon: '💻', description: 'Tech reviews, tutorials, industry insights' },
  { value: 'education', label: 'Education', icon: '📚', description: 'Educational content, courses, learning tips' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨', description: 'Daily life, wellness, personal development' },
  { value: 'business', label: 'Business', icon: '💼', description: 'Entrepreneurship, marketing, professional tips' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭', description: 'Fun content, memes, entertainment' },
  { value: 'food', label: 'Food & Cooking', icon: '🍳', description: 'Recipes, cooking tips, food reviews' },
  { value: 'travel', label: 'Travel', icon: '✈️', description: 'Travel guides, destinations, experiences' }
];

const DURATION_OPTIONS = [
  { value: '1week', label: '1 Week', days: 7 },
  { value: '15days', label: '15 Days', days: 15 },
  { value: '30days', label: '30 Days', days: 30 },
  { value: 'custom', label: 'Custom', days: null }
];

export default function EnhancedProjectForm({ onProjectCreate, onCancel }: EnhancedProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    channel: '',
    contentType: '',
    title: '',
    description: '',
    duration: '1week',
    customDuration: undefined,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    targetAudience: '',
    tags: [],
    isPublic: false
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();

  // Debounced progress update to prevent excessive re-renders
  const updateGenerationStep = useCallback((step: string) => {
    setGenerationStep(step);
  }, []);

  // Memoize the form data to prevent unnecessary re-renders
  // const memoizedFormData = useMemo(() => formData, [
  //   formData.name,
  //   formData.channel,
  //   formData.contentType,
  //   formData.title,
  //   formData.description,
  //   formData.duration,
  //   formData.customDuration,
  //   formData.startDate,
  //   formData.endDate,
  //   formData.targetAudience,
  //   formData.tags,
  //   formData.isPublic
  // ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && !isGenerating) {
        e.preventDefault();
        const form = document.getElementById('enhanced-project-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
      }
      if (e.key === 'Escape' && showPreview) {
        setShowPreview(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, showPreview]);

  // Update end date when duration changes
  useEffect(() => {
    const startDate = new Date(formData.startDate);
    let days = 7;

    if (formData.duration === 'custom' && formData.customDuration) {
      days = formData.customDuration;
    } else {
      const durationOption = DURATION_OPTIONS.find(opt => opt.value === formData.duration);
      if (durationOption) {
        days = durationOption.days || 7;
      }
    }

    const endDate = addDays(startDate, days - 1);
    setFormData(prev => ({
      ...prev,
      endDate: format(endDate, 'yyyy-MM-dd')
    }));
  }, [formData.duration, formData.customDuration, formData.startDate]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    if (!formData.name.trim()) {
      validationErrors.push('Project name is required');
    }

    if (!formData.channel) {
      validationErrors.push('Please select a channel');
    }

    if (!formData.contentType) {
      validationErrors.push('Please select a content type');
    }

    if (!formData.title.trim()) {
      validationErrors.push('Content title is required');
    }

    if (!formData.description.trim()) {
      validationErrors.push('Content description is required');
    }

    if (formData.duration === 'custom' && (!formData.customDuration || formData.customDuration < 1)) {
      validationErrors.push('Custom duration must be at least 1 day');
    }

    if (!formData.targetAudience.trim()) {
      validationErrors.push('Target audience is required');
    }

    return validationErrors;
  };

  const generateAIContent = async (projectData: FormData) => {
    try {
      updateGenerationStep('Analyzing project requirements...');
      
      const totalDays = projectData.duration === 'custom' 
        ? projectData.customDuration || 7
        : DURATION_OPTIONS.find(opt => opt.value === projectData.duration)?.days || 7;

      updateGenerationStep(`Generating ${totalDays} unique content pieces with optimal scheduling...`);

      // Use enhanced content generation for unique, non-repetitive content
      try {
        const result = await enhancedContentApi.generateEnhancedContent({
          projectName: projectData.name,
          contentName: projectData.title,
          contentDescription: projectData.description,
          contentType: projectData.contentType,
          channelType: projectData.channel,
          targetAudience: projectData.targetAudience,
          startDate: projectData.startDate,
          endDate: format(addDays(new Date(projectData.startDate), totalDays - 1), 'yyyy-MM-dd'),
          totalDays,
          preferences: {
            avoidRepetition: true,
            optimizeScheduling: true,
            includeEngagementPrediction: true,
            themeDiversity: true
          }
        });

        if (result.success && result.contentItems.length > 0) {
          updateGenerationStep('Content generated successfully!');
          return result.contentItems;
        }
      } catch (enhancedError) {
        console.warn('Enhanced content generation failed, falling back to basic generation:', enhancedError);
      }

      // Fallback to basic generation
      updateGenerationStep(`Generating ${totalDays} content pieces...`);

      const contentItems: any[] = [];
      const startDate = new Date(projectData.startDate);

      // Generate all content at once to avoid frequent state updates
      const contentPromises = [];
      
      for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(startDate, i);
        
        contentPromises.push(
          (async () => {
            try {
              // Try AI generation first
              const result = await aiContentApi.generateProjectContent({
                contentType: projectData.contentType,
                contentTitle: projectData.title,
                contentDescription: projectData.description,
                channelType: projectData.channel,
                startDate: format(currentDate, 'yyyy-MM-dd'),
                endDate: format(currentDate, 'yyyy-MM-dd'),
                targetAudience: projectData.targetAudience,
                projectTypes: [projectData.contentType]
              });

              if (result.contentItems && result.contentItems.length > 0) {
                return result.contentItems.map((item: any, index: number) => ({
                  ...item,
                  id: `${projectData.channel}-${projectData.contentType}-day-${i + 1}-${index}`,
                  platform: projectData.channel,
                  contentType: projectData.contentType,
                  scheduledDate: format(currentDate, 'yyyy-MM-dd'),
                  scheduledTime: getOptimalPostingTime(projectData.channel, projectData.contentType),
                  dayNumber: i + 1
                }));
              } else {
                // Fallback content generation
                return [generateFallbackContent(projectData, i + 1, currentDate)];
              }
            } catch (error) {
              console.warn(`AI generation failed for day ${i + 1}, using fallback:`, error);
              return [generateFallbackContent(projectData, i + 1, currentDate)];
            }
          })()
        );
      }

      // Wait for all content to be generated
      const results = await Promise.all(contentPromises);
      
      // Flatten the results
      results.forEach(dayContent => {
        contentItems.push(...dayContent);
      });

      updateGenerationStep('Optimizing content calendar...');
      return contentItems;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw error;
    }
  };

  const generateFallbackContent = (projectData: FormData, dayNumber: number, scheduledDate: Date) => {
    // Enhanced content variations based on content type and day number
    const getContentVariations = (contentType: string, title: string, dayNumber: number) => {
      const variations = {
        fitness: [
          `💪 ${title} - Day ${dayNumber}: Morning Motivation`,
          `🏃‍♀️ ${title} - Day ${dayNumber}: Workout Wednesday`,
          `🥗 ${title} - Day ${dayNumber}: Nutrition Tips`,
          `💤 ${title} - Day ${dayNumber}: Recovery & Rest`,
          `🎯 ${title} - Day ${dayNumber}: Goal Setting`,
          `🔥 ${title} - Day ${dayNumber}: High Intensity`,
          `🧘‍♀️ ${title} - Day ${dayNumber}: Mindful Movement`
        ],
        tech: [
          `💻 ${title} - Day ${dayNumber}: Tech Tutorial`,
          `🚀 ${title} - Day ${dayNumber}: Innovation Spotlight`,
          `🔧 ${title} - Day ${dayNumber}: Tool Review`,
          `📱 ${title} - Day ${dayNumber}: App Feature`,
          `🌐 ${title} - Day ${dayNumber}: Web Development`,
          `🤖 ${title} - Day ${dayNumber}: AI Insights`,
          `⚡ ${title} - Day ${dayNumber}: Performance Tips`
        ],
        education: [
          `📚 ${title} - Day ${dayNumber}: Study Tips`,
          `🎓 ${title} - Day ${dayNumber}: Learning Strategy`,
          `📝 ${title} - Day ${dayNumber}: Note Taking`,
          `🧠 ${title} - Day ${dayNumber}: Memory Techniques`,
          `📖 ${title} - Day ${dayNumber}: Book Review`,
          `🎯 ${title} - Day ${dayNumber}: Exam Prep`,
          `💡 ${title} - Day ${dayNumber}: Study Hacks`
        ],
        business: [
          `💼 ${title} - Day ${dayNumber}: Business Strategy`,
          `📈 ${title} - Day ${dayNumber}: Growth Tips`,
          `🤝 ${title} - Day ${dayNumber}: Networking`,
          `💰 ${title} - Day ${dayNumber}: Financial Planning`,
          `📊 ${title} - Day ${dayNumber}: Data Analysis`,
          `🎯 ${title} - Day ${dayNumber}: Goal Setting`,
          `🚀 ${title} - Day ${dayNumber}: Innovation`
        ],
        lifestyle: [
          `✨ ${title} - Day ${dayNumber}: Daily Inspiration`,
          `🌅 ${title} - Day ${dayNumber}: Morning Routine`,
          `🌙 ${title} - Day ${dayNumber}: Evening Wind-down`,
          `🧘‍♀️ ${title} - Day ${dayNumber}: Mindfulness`,
          `🎨 ${title} - Day ${dayNumber}: Creative Expression`,
          `🏠 ${title} - Day ${dayNumber}: Home Organization`,
          `🌱 ${title} - Day ${dayNumber}: Personal Growth`
        ],
        entertainment: [
          `🎭 ${title} - Day ${dayNumber}: Fun Facts`,
          `🎬 ${title} - Day ${dayNumber}: Movie Review`,
          `🎵 ${title} - Day ${dayNumber}: Music Spotlight`,
          `🎮 ${title} - Day ${dayNumber}: Gaming Tips`,
          `📺 ${title} - Day ${dayNumber}: Show Recommendation`,
          `🎪 ${title} - Day ${dayNumber}: Entertainment News`,
          `😄 ${title} - Day ${dayNumber}: Humor & Memes`
        ],
        food: [
          `🍳 ${title} - Day ${dayNumber}: Recipe of the Day`,
          `🥗 ${title} - Day ${dayNumber}: Healthy Eating`,
          `👨‍🍳 ${title} - Day ${dayNumber}: Cooking Tips`,
          `🍽️ ${title} - Day ${dayNumber}: Meal Planning`,
          `🌶️ ${title} - Day ${dayNumber}: Spice Spotlight`,
          `🥘 ${title} - Day ${dayNumber}: Cultural Cuisine`,
          `🍰 ${title} - Day ${dayNumber}: Dessert Delight`
        ],
        travel: [
          `✈️ ${title} - Day ${dayNumber}: Destination Guide`,
          `🏖️ ${title} - Day ${dayNumber}: Beach Tips`,
          `🏔️ ${title} - Day ${dayNumber}: Adventure Travel`,
          `🏛️ ${title} - Day ${dayNumber}: Cultural Sites`,
          `🍽️ ${title} - Day ${dayNumber}: Local Food`,
          `📸 ${title} - Day ${dayNumber}: Photo Spots`,
          `🎒 ${title} - Day ${dayNumber}: Packing Tips`
        ]
      };

      return variations[contentType as keyof typeof variations] || variations.fitness;
    };

    const getDescriptionVariations = (contentType: string, title: string, targetAudience: string, dayNumber: number) => {
      const descriptions = {
        fitness: [
          `💪 Transform your fitness journey with day ${dayNumber} of ${title}. Perfect for ${targetAudience} looking to build strength and confidence.`,
          `🏃‍♀️ Discover the power of consistent movement with our day ${dayNumber} ${title} guide. Ideal for ${targetAudience} ready to level up.`,
          `🥗 Fuel your body right with day ${dayNumber} nutrition insights from ${title}. Essential for ${targetAudience} committed to health.`,
          `💤 Master the art of recovery with day ${dayNumber} of ${title}. Crucial for ${targetAudience} seeking optimal performance.`,
          `🎯 Set and achieve your fitness goals with day ${dayNumber} of ${title}. Perfect for ${targetAudience} ready for transformation.`
        ],
        tech: [
          `💻 Master the latest in technology with day ${dayNumber} of ${title}. Essential for ${targetAudience} staying ahead of the curve.`,
          `🚀 Explore cutting-edge innovations in day ${dayNumber} of ${title}. Perfect for ${targetAudience} passionate about tech.`,
          `🔧 Get hands-on with powerful tools in day ${dayNumber} of ${title}. Ideal for ${targetAudience} looking to optimize workflows.`,
          `📱 Discover mobile-first solutions in day ${dayNumber} of ${title}. Great for ${targetAudience} embracing digital transformation.`,
          `🤖 Dive into AI and automation with day ${dayNumber} of ${title}. Perfect for ${targetAudience} ready for the future.`
        ],
        education: [
          `📚 Accelerate your learning with day ${dayNumber} of ${title}. Essential for ${targetAudience} committed to growth.`,
          `🎓 Master effective study techniques in day ${dayNumber} of ${title}. Perfect for ${targetAudience} pursuing excellence.`,
          `📝 Transform your note-taking skills with day ${dayNumber} of ${title}. Ideal for ${targetAudience} maximizing retention.`,
          `🧠 Unlock your memory potential with day ${dayNumber} of ${title}. Great for ${targetAudience} seeking academic success.`,
          `💡 Discover innovative learning strategies in day ${dayNumber} of ${title}. Perfect for ${targetAudience} ready to excel.`
        ],
        business: [
          `💼 Scale your business with day ${dayNumber} of ${title}. Essential for ${targetAudience} driving growth and innovation.`,
          `📈 Master data-driven decisions in day ${dayNumber} of ${title}. Perfect for ${targetAudience} optimizing performance.`,
          `🤝 Build powerful networks with day ${dayNumber} of ${title}. Ideal for ${targetAudience} expanding their reach.`,
          `💰 Optimize your financial strategy with day ${dayNumber} of ${title}. Great for ${targetAudience} maximizing profits.`,
          `🚀 Launch your next big idea with day ${dayNumber} of ${title}. Perfect for ${targetAudience} ready to innovate.`
        ],
        lifestyle: [
          `✨ Transform your daily routine with day ${dayNumber} of ${title}. Perfect for ${targetAudience} seeking balance and joy.`,
          `🌅 Start each day with purpose using day ${dayNumber} of ${title}. Ideal for ${targetAudience} embracing mindfulness.`,
          `🧘‍♀️ Find inner peace with day ${dayNumber} of ${title}. Great for ${targetAudience} prioritizing mental health.`,
          `🎨 Express your creativity through day ${dayNumber} of ${title}. Perfect for ${targetAudience} exploring their artistic side.`,
          `🌱 Grow personally with day ${dayNumber} of ${title}. Essential for ${targetAudience} committed to self-improvement.`
        ],
        entertainment: [
          `🎭 Discover amazing entertainment in day ${dayNumber} of ${title}. Perfect for ${targetAudience} seeking fun and relaxation.`,
          `🎬 Get the latest in movies and shows with day ${dayNumber} of ${title}. Ideal for ${targetAudience} who love cinema.`,
          `🎵 Explore new music and artists in day ${dayNumber} of ${title}. Great for ${targetAudience} passionate about music.`,
          `🎮 Level up your gaming with day ${dayNumber} of ${title}. Perfect for ${targetAudience} embracing digital entertainment.`,
          `😄 Brighten your day with humor and memes in day ${dayNumber} of ${title}. Ideal for ${targetAudience} seeking joy.`
        ],
        food: [
          `🍳 Master the kitchen with day ${dayNumber} of ${title}. Perfect for ${targetAudience} passionate about cooking.`,
          `🥗 Discover healthy eating with day ${dayNumber} of ${title}. Ideal for ${targetAudience} prioritizing nutrition.`,
          `👨‍🍳 Learn professional techniques in day ${dayNumber} of ${title}. Great for ${targetAudience} aspiring chefs.`,
          `🍽️ Plan perfect meals with day ${dayNumber} of ${title}. Essential for ${targetAudience} seeking organization.`,
          `🌶️ Spice up your life with day ${dayNumber} of ${title}. Perfect for ${targetAudience} exploring flavors.`
        ],
        travel: [
          `✈️ Explore the world with day ${dayNumber} of ${title}. Perfect for ${targetAudience} with wanderlust.`,
          `🏖️ Discover hidden gems in day ${dayNumber} of ${title}. Ideal for ${targetAudience} seeking adventure.`,
          `🏔️ Conquer new heights with day ${dayNumber} of ${title}. Great for ${targetAudience} embracing outdoor life.`,
          `🏛️ Immerse in culture with day ${dayNumber} of ${title}. Perfect for ${targetAudience} seeking authentic experiences.`,
          `📸 Capture memories with day ${dayNumber} of ${title}. Essential for ${targetAudience} documenting their journey.`
        ]
      };

      const typeDescriptions = descriptions[contentType as keyof typeof descriptions] || descriptions.fitness;
      return typeDescriptions[dayNumber % typeDescriptions.length];
    };

    const getHashtags = (contentType: string, channel: string, title: string, dayNumber: number) => {
      const baseHashtags = [
        `#${contentType}`,
        `#${channel}`,
        `#${title.toLowerCase().replace(/\s+/g, '')}`,
        `#day${dayNumber}`,
        '#content',
        '#tips',
        '#learn',
        '#growth',
        '#motivation'
      ];

      const contentTypeHashtags = {
        fitness: ['#fitness', '#workout', '#health', '#wellness', '#strength'],
        tech: ['#technology', '#innovation', '#digital', '#coding', '#ai'],
        education: ['#education', '#learning', '#study', '#knowledge', '#academic'],
        business: ['#business', '#entrepreneur', '#leadership', '#strategy', '#success'],
        lifestyle: ['#lifestyle', '#wellness', '#mindfulness', '#selfcare', '#balance'],
        entertainment: ['#entertainment', '#fun', '#movies', '#music', '#gaming'],
        food: ['#food', '#cooking', '#recipe', '#nutrition', '#chef'],
        travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#vacation']
      };

      const channelHashtags = {
        instagram: ['#instagram', '#insta', '#photo', '#visual'],
        facebook: ['#facebook', '#social', '#community', '#share'],
        linkedin: ['#linkedin', '#professional', '#career', '#networking'],
        tiktok: ['#tiktok', '#viral', '#trending', '#shortform'],
        youtube: ['#youtube', '#video', '#subscribe', '#creator'],
        twitter: ['#twitter', '#tweet', '#trending', '#social'],
        pinterest: ['#pinterest', '#pin', '#inspiration', '#ideas']
      };

      const typeTags = contentTypeHashtags[contentType as keyof typeof contentTypeHashtags] || [];
      const channelTags = channelHashtags[channel as keyof typeof channelHashtags] || [];

      return [...baseHashtags, ...typeTags, ...channelTags].slice(0, 8);
    };

    const contentVariations = getContentVariations(projectData.contentType, projectData.title, dayNumber);
    const descriptionVariations = getDescriptionVariations(
      projectData.contentType, 
      projectData.title, 
      projectData.targetAudience, 
      dayNumber
    );
    const hashtags = getHashtags(projectData.contentType, projectData.channel, projectData.title, dayNumber);

    return {
      id: `fallback-${projectData.channel}-${projectData.contentType}-day-${dayNumber}`,
      title: contentVariations[dayNumber % contentVariations.length],
      description: descriptionVariations,
      content: `Welcome to day ${dayNumber} of your ${projectData.title} journey! ${projectData.description}\n\nThis content is specifically crafted for ${projectData.targetAudience} and optimized for ${projectData.channel}. Each day brings new insights and actionable tips to help you succeed.`,
      hashtags,
      platform: projectData.channel,
      contentType: projectData.contentType,
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      scheduledTime: getOptimalPostingTime(projectData.channel, projectData.contentType),
      status: 'draft',
      dayNumber
    };
  };

  const getOptimalPostingTime = (channel: string, contentType: string): string => {
    const timeSlots = {
      instagram: {
        fitness: ['07:00', '12:00', '18:00', '20:00'],
        tech: ['09:00', '15:00', '19:00', '21:00'],
        education: ['08:00', '14:00', '18:00', '20:00'],
        default: ['09:00', '15:00', '19:00', '21:00']
      },
      facebook: {
        default: ['13:00', '15:00', '19:00', '20:00']
      },
      linkedin: {
        business: ['08:00', '12:00', '17:00', '18:00'],
        default: ['09:00', '14:00', '17:00', '19:00']
      },
      tiktok: {
        entertainment: ['18:00', '20:00', '21:00'],
        default: ['19:00', '20:00', '21:00']
      },
      youtube: {
        education: ['14:00', '16:00', '19:00'],
        entertainment: ['18:00', '20:00', '21:00'],
        default: ['15:00', '18:00', '20:00']
      },
      twitter: {
        default: ['09:00', '12:00', '15:00', '18:00']
      },
      pinterest: {
        default: ['20:00', '21:00', '22:00']
      }
    };

    const channelTimes = timeSlots[channel as keyof typeof timeSlots] || timeSlots.instagram;
    const contentTimes = channelTimes[contentType as keyof typeof channelTimes] || channelTimes.default;
    return contentTimes[Math.floor(Math.random() * contentTimes.length)];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the following issues before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setErrors([]);

    try {
      const contentItems = await generateAIContent(formData);
      
      // Validate that we have content for all days
      const expectedDays = formData.duration === 'custom' 
        ? formData.customDuration || 7
        : DURATION_OPTIONS.find(opt => opt.value === formData.duration)?.days || 7;
      
      if (contentItems.length < expectedDays) {
        console.warn(`Expected ${expectedDays} content items, got ${contentItems.length}`);
      }

      setGeneratedContent(contentItems);
      setShowPreview(true);
      
      toast({
        title: "✨ Content Generated Successfully!",
        description: `Generated ${contentItems.length} unique content pieces for your ${formData.duration} project.`,
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmCreation = () => {
    const project = {
      ...formData,
      aiGeneratedContent: generatedContent,
      contentCalendar: generatedContent.map(item => ({
        id: `calendar-${item.id}`,
        date: item.scheduledDate,
        time: item.scheduledTime,
        contentId: item.id,
        platform: item.platform,
        engagement: Math.floor(Math.random() * 100) + 50,
        optimalPostingTime: true
      })),
      type: 'social-media',
      status: 'active',
      createdAt: new Date().toISOString(),
      metadata: {
        totalContent: generatedContent.length,
        duration: formData.duration,
        channels: [formData.channel],
        contentTypes: [formData.contentType]
      }
    };

    onProjectCreate(project);
    
    toast({
      title: "🎉 Project Created Successfully!",
      description: `"${formData.name}" has been created with ${generatedContent.length} content pieces scheduled.`,
    });
  };

  return (
    <div className="max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Social Media Project
          </h2>
          <p className="text-gray-600">AI-powered content generation and scheduling</p>
          <div className="mt-2 text-sm text-gray-500">
            💡 <strong>Tip:</strong> Press <kbd className="bg-gray-100 px-1 rounded border text-xs">Ctrl</kbd> + <kbd className="bg-gray-100 px-1 rounded border text-xs">Enter</kbd> to generate content quickly
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Generation Progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mx-6 mt-4 shadow-lg"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Agent Processing
                </h4>
                <p className="text-sm text-purple-700 mt-1">{generationStep}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-purple-600">Generating unique content...</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" />
                  </div>
                  <div className="flex justify-between text-xs text-purple-600 mt-1">
                    <span>Creating unique content for each day</span>
                    <span>Optimizing for {formData.channel}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <form id="enhanced-project-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Please fix the following issues:</h4>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Project Name */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Project Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your project name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="title">Content Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter the main content title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Content Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what your content will be about"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Channel Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>Channel & Content Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Channel *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {CHANNEL_OPTIONS.map((channel) => (
                    <motion.button
                      key={channel.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('channel', channel.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.channel === channel.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-8 h-8 rounded-full ${channel.color} flex items-center justify-center text-white text-lg`}>
                          {channel.icon}
                        </div>
                        <span className="text-sm font-medium">{channel.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Content Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {CONTENT_TYPE_OPTIONS.map((type) => (
                    <motion.button
                      key={type.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('contentType', type.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.contentType === type.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duration & Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Duration & Scheduling</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Duration *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {DURATION_OPTIONS.map((duration) => (
                    <motion.button
                      key={duration.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('duration', duration.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.duration === duration.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">{duration.label}</div>
                        {duration.days && (
                          <div className="text-xs text-gray-500">{duration.days} days</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {formData.duration === 'custom' && (
                <div>
                  <Label htmlFor="customDuration">Custom Duration (days) *</Label>
                  <Input
                    id="customDuration"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.customDuration || ''}
                    onChange={(e) => handleInputChange('customDuration', parseInt(e.target.value) || undefined)}
                    placeholder="Enter number of days"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="mt-1"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience & Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Target Audience & Tags</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="e.g., Fitness enthusiasts, Tech professionals, Students"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(tagInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTagAdd(tagInput)}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
                <Label htmlFor="isPublic">Make this project public</Label>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Content Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="text-xl font-bold">Content Preview</h3>
                  <p className="text-gray-600">Review your generated content before creating the project</p>
                </div>
                <Button variant="ghost" onClick={() => setShowPreview(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid gap-4">
                  {generatedContent.map((content) => (
                    <Card key={content.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Day {content.dayNumber}</Badge>
                            <Badge variant="secondary">{content.platform}</Badge>
                            <Badge variant="secondary">{content.contentType}</Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {content.scheduledDate} at {content.scheduledTime}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2">{content.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{content.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {content.hashtags.map((hashtag: string) => (
                            <span key={hashtag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {hashtag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Back to Edit
                </Button>
                <Button
                  onClick={handleConfirmCreation}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
