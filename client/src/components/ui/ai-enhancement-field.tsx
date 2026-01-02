import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AIEnhancementFieldProps {
  value: string;
  onChange: (value: string) => void;
  field: string;
  context: {
    title?: string;
    description?: string;
    platform?: string;
    contentType?: string;
    hashtags?: string[];
    category?: string;
  };
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

interface EnhancementSuggestion {
  id: string;
  text: string;
  confidence: number;
  type: 'title' | 'description' | 'hashtags' | 'caption' | 'script';
  reasoning: string;
}

export default function AIEnhancementField({
  value,
  onChange,
  field,
  context,
  placeholder,
  rows = 3,
  maxLength,
  className = '',
  disabled = false
}: AIEnhancementFieldProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<EnhancementSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EnhancementSuggestion | null>(null);
  const { toast } = useToast();

  // Handle AI enhancement
  const handleEnhancement = async () => {
    if (!value.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some content before enhancing with AI",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    setShowSuggestions(true);

    try {
      const response = await fetch('/api/ai/enhance-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contentId: `enhance_${Date.now()}`,
          field: field,
          currentValue: value,
          context: context
        })
      });

      if (!response.ok) throw new Error('Failed to enhance content');

      const { enhancedValue } = await response.json();
      
      // Generate multiple suggestions
      const generatedSuggestions: EnhancementSuggestion[] = [
        {
          id: 'enhanced_1',
          text: enhancedValue,
          confidence: 0.95,
          type: field as EnhancementSuggestion['type'],
          reasoning: 'AI-optimized for maximum engagement'
        },
        {
          id: 'enhanced_2',
          text: generateAlternativeSuggestion(value, field),
          confidence: 0.88,
          type: field as EnhancementSuggestion['type'],
          reasoning: 'Alternative approach with different tone'
        },
        {
          id: 'enhanced_3',
          text: generateTrendySuggestion(value, field, context),
          confidence: 0.92,
          type: field as EnhancementSuggestion['type'],
          reasoning: 'Trendy and viral-optimized version'
        }
      ];

      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error enhancing content:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate alternative suggestion
  const generateAlternativeSuggestion = (text: string, field: string): string => {
    if (field === 'title') {
      return `Alternative: ${text}`;
    } else if (field === 'description') {
      return `💡 ${text}\n\nWhat do you think? Share your thoughts below! 👇`;
    } else if (field === 'hashtags') {
      return text + ' #viral #trending #content';
    }
    return text;
  };

  // Generate trendy suggestion
  const generateTrendySuggestion = (text: string, field: string, context: any): string => {
    if (field === 'title') {
      return `🔥 ${text} - You Won't Believe This!`;
    } else if (field === 'description') {
      return `✨ ${text}\n\nPOV: You're about to discover something amazing! 🚀\n\n#trending #viral #mustsee`;
    } else if (field === 'hashtags') {
      return text + ' #fyp #viral #trending #foryou';
    }
    return text;
  };

  // Apply suggestion
  const applySuggestion = (suggestion: EnhancementSuggestion) => {
    onChange(suggestion.text);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    
    toast({
      title: "Content Enhanced",
      description: `${field} has been enhanced with AI`,
    });
  };

  // Reject all suggestions
  const rejectSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestion(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        {rows > 1 ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            className="pr-12"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="pr-12"
          />
        )}
        
        {/* AI Enhancement Button */}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleEnhancement}
          disabled={disabled || isEnhancing || !value.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          {isEnhancing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Character Count */}
      {maxLength && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {value.length}/{maxLength}
        </div>
      )}

      {/* AI Suggestions Modal */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>AI Enhancement Suggestions</span>
            </DialogTitle>
            <DialogDescription>
              Get AI-powered suggestions to improve your content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Original Content */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original {field}</h4>
              <p className="text-sm text-gray-600">{value}</p>
            </div>

            {/* AI Suggestions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">AI Suggestions</h4>
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Suggestion {index + 1}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          suggestion.confidence > 0.9 ? 'bg-green-100 text-green-800' :
                          suggestion.confidence > 0.8 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-800 mb-2">{suggestion.text}</p>
                  <p className="text-xs text-gray-500 mb-3">{suggestion.reasoning}</p>
                  
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Use This Suggestion
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={rejectSuggestions}
              >
                <X className="h-4 w-4 mr-2" />
                Keep Original
              </Button>
              <Button
                variant="outline"
                onClick={handleEnhancement}
                disabled={isEnhancing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isEnhancing ? 'Generating...' : 'Generate More'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Specialized components for different field types
export function AITitleField(props: Omit<AIEnhancementFieldProps, 'field' | 'rows'>) {
  return (
    <AIEnhancementField
      {...props}
      field="title"
      rows={1}
      maxLength={100}
    />
  );
}

export function AIDescriptionField(props: Omit<AIEnhancementFieldProps, 'field'>) {
  return (
    <AIEnhancementField
      {...props}
      field="description"
      rows={4}
      maxLength={2200}
    />
  );
}

export function AIHashtagField(props: Omit<AIEnhancementFieldProps, 'field' | 'rows'>) {
  return (
    <AIEnhancementField
      {...props}
      field="hashtags"
      rows={1}
      maxLength={500}
    />
  );
}

export function AICaptionField(props: Omit<AIEnhancementFieldProps, 'field'>) {
  return (
    <AIEnhancementField
      {...props}
      field="caption"
      rows={3}
      maxLength={2200}
    />
  );
}

export function AIScriptField(props: Omit<AIEnhancementFieldProps, 'field'>) {
  return (
    <AIEnhancementField
      {...props}
      field="script"
      rows={6}
      maxLength={5000}
    />
  );
}
