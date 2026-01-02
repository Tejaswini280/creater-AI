import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, Image, FileAudio, Edit3, Settings, X, 
  Zap, Palette, Scissors, Music, Type, Download, Volume2, BarChart3
} from 'lucide-react';
import AdvancedMediaEditor from './AdvancedMediaEditor';
import VideoEditor from './VideoEditor';
import ImageEditor from './ImageEditor';
import AudioEditor from './AudioEditor';

interface MediaFile {
  id: string;
  file: File | null;
  type: 'video' | 'image' | 'audio';
  url: string;
  name: string;
  size: number;
}

interface MediaEditorLauncherProps {
  media: MediaFile;
  onClose: () => void;
  onSave?: (editedMedia: Blob, originalMedia: MediaFile) => void;
}

const EDITOR_FEATURES = {
  video: {
    icon: Video,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      { icon: Scissors, label: 'Trim & Cut', description: 'Precise video trimming and cutting' },
      { icon: Palette, label: 'Filters & Effects', description: 'Professional video filters and effects' },
      { icon: Type, label: 'Text Overlays', description: 'Add animated text and captions' },
      { icon: Music, label: 'Background Music', description: 'Add and mix background music' },
      { icon: Zap, label: 'Transitions', description: 'Smooth video transitions' },
      { icon: Edit3, label: 'Advanced Editing', description: 'Professional editing tools' }
    ]
  },
  image: {
    icon: Image,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: [
      { icon: Edit3, label: 'Crop & Resize', description: 'Smart cropping and resizing tools' },
      { icon: Palette, label: 'Filters & Presets', description: 'Professional photo filters' },
      { icon: Type, label: 'Text & Stickers', description: 'Add text overlays and stickers' },
      { icon: Zap, label: 'AI Enhancement', description: 'AI-powered image enhancement' },
      { icon: Settings, label: 'Effects', description: 'Advanced visual effects' },
      { icon: Download, label: 'Export Options', description: 'Multiple format export' }
    ]
  },
  audio: {
    icon: FileAudio,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      { icon: Scissors, label: 'Trim & Merge', description: 'Audio trimming and merging' },
      { icon: Volume2, label: 'Volume Control', description: 'Precise volume adjustment' },
      { icon: Zap, label: 'Noise Reduction', description: 'AI-powered noise reduction' },
      { icon: Music, label: 'Background Music', description: 'Add background tracks' },
      { icon: BarChart3, label: 'Audio Effects', description: 'Echo, reverb, and more' },
      { icon: Download, label: 'Export Formats', description: 'MP3, WAV, OGG, AAC' }
    ]
  }
};

export default function MediaEditorLauncher({ media, onClose }: MediaEditorLauncherProps) {
  const [selectedEditor, setSelectedEditor] = useState<'advanced' | 'specialized' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const editorConfig = EDITOR_FEATURES[media.type];
  const IconComponent = editorConfig.icon;

  // Debug logging
  console.log('🎬 MediaEditorLauncher received media:', media);
  console.log('📁 Media URL:', media.url);
  console.log('📁 Media type:', media.type);
  console.log('📁 Media file:', media.file);

  const handleLaunchEditor = () => {
    console.log('🚀 Launching specialized editor for:', media.type);
    setSelectedEditor('specialized');
  };

  const handleSave = async (editedMedia: Blob) => {
    setIsProcessing(true);
    try {
      if (onSave) {
        // Use the onSave callback if provided
        onSave(editedMedia, media);
        onClose();
      } else {
        // Fallback to download if no callback provided
        const url = URL.createObjectURL(editedMedia);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited-${media.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Close the editor
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (selectedEditor) {
      setSelectedEditor(null);
    } else {
      onClose();
    }
  };

  // Render specialized editor based on media type
  const renderSpecializedEditor = () => {
    console.log('🎨 Rendering specialized editor for:', media.type);
    console.log('📁 Media URL being passed:', media.url);
    
    switch (media.type) {
      case 'video':
        return (
          <VideoEditor
            videoUrl={media.url}
            onSave={handleSave}
            onClose={handleClose}
          />
        );
      case 'image':
        return (
          <ImageEditor
            imageUrl={media.url}
            onSave={handleSave}
            onClose={handleClose}
          />
        );
      case 'audio':
        return (
          <AudioEditor
            audioUrl={media.url}
            onSave={handleSave}
            onClose={handleClose}
          />
        );
      default:
        console.error('❌ Unknown media type:', media.type);
        return null;
    }
  };

  // If an editor is selected, render it
  if (selectedEditor === 'specialized') {
    return renderSpecializedEditor();
  }

  // Main launcher interface - Single unified editor section
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${editorConfig.bgColor}`}>
              <IconComponent className={`w-6 h-6 ${editorConfig.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Professional {media.type.charAt(0).toUpperCase() + media.type.slice(1)} Editor</h2>
              <p className="text-sm text-gray-600">
                Edit your {media.type}: {media.name}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Single Unified Editor Section */}
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${editorConfig.bgColor}`}>
                  <IconComponent className={`w-8 h-8 ${editorConfig.color}`} />
                </div>
                <div>
                  <CardTitle className="text-xl">Professional {media.type.charAt(0).toUpperCase() + media.type.slice(1)} Editor</CardTitle>
                  <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700">Full-Featured Editor</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Comprehensive {media.type} editing suite with professional-grade tools. 
                Real-time preview, advanced effects, and high-quality export options.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span>Real-time preview</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Professional tools</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4 text-purple-600" />
                  <span>High-quality export</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span>Advanced effects</span>
                </div>
              </div>

              <Button
                onClick={handleLaunchEditor}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-medium"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Launching Editor...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5 mr-2" />
                    Launch Professional Editor
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Feature Comparison */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Available Features</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {editorConfig.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`p-2 rounded-lg ${editorConfig.bgColor}`}>
                    <feature.icon className={`w-5 h-5 ${editorConfig.color}`} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{feature.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Ready to edit? Launch the professional editor with all features included.
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleLaunchEditor}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isProcessing}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Start Editing Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
