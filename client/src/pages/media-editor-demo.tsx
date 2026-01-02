import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, Image as ImageIcon, Mic, Upload, Play, Edit3, Sparkles,
  Film, Palette, Scissors, Type, Music, BarChart3
} from 'lucide-react';
import { MediaEditorLauncher } from '@/components/editors';

interface DemoMedia {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  url: string;
  size: number;
  description: string;
}

const DEMO_MEDIA: DemoMedia[] = [
  {
    id: '1',
    name: 'Sample Video.mp4',
    type: 'video',
    url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    size: 1024 * 1024,
    description: 'HD sample video for testing video editing features'
  },
  {
    id: '2',
    name: 'Sample Image.jpg',
    type: 'image',
    url: 'https://picsum.photos/800/600',
    size: 512 * 1024,
    description: 'High-quality sample image for testing image editing features'
  },
  {
    id: '3',
    name: 'Sample Audio.mp3',
    type: 'audio',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    size: 256 * 1024,
    description: 'Sample audio file for testing audio editing features'
  }
];

export default function MediaEditorDemo() {
  const [selectedMedia, setSelectedMedia] = useState<DemoMedia | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleEditMedia = (media: DemoMedia) => {
    setSelectedMedia(media);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedMedia(null);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-6 h-6 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-green-600" />;
      case 'audio':
        return <Mic className="w-6 h-6 text-purple-600" />;
      default:
        return <Upload className="w-6 h-6 text-gray-600" />;
    }
  };

  const getMediaColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-50 border-blue-200';
      case 'image':
        return 'bg-green-50 border-green-200';
      case 'audio':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getFeatureList = (type: string) => {
    switch (type) {
      case 'video':
        return [
          { icon: Scissors, label: 'Trim & Cut', color: 'text-blue-600' },
          { icon: Palette, label: 'Filters & Effects', color: 'text-blue-600' },
          { icon: Type, label: 'Text Overlays', color: 'text-blue-600' },
          { icon: Music, label: 'Background Music', color: 'text-blue-600' },
          { icon: Film, label: 'Transitions', color: 'text-blue-600' }
        ];
      case 'image':
        return [
          { icon: Edit3, label: 'Crop & Resize', color: 'text-green-600' },
          { icon: Palette, label: 'Filters & Presets', color: 'text-green-600' },
          { icon: Type, label: 'Text & Stickers', color: 'text-green-600' },
          { icon: Sparkles, label: 'AI Enhancement', color: 'text-green-600' },
          { icon: BarChart3, label: 'Effects', color: 'text-green-600' }
        ];
      case 'audio':
        return [
          { icon: Scissors, label: 'Trim & Merge', color: 'text-purple-600' },
          { icon: BarChart3, label: 'Volume Control', color: 'text-purple-600' },
          { icon: Sparkles, label: 'Noise Reduction', color: 'text-purple-600' },
          { icon: Music, label: 'Background Music', color: 'text-purple-600' },
          { icon: Palette, label: 'Audio Effects', color: 'text-purple-600' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Media Editor Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience professional-grade video, image, and audio editing tools with real-time preview, 
            advanced filters, and AI-powered enhancements.
          </p>
        </div>

        {/* Features Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Professional Editing Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Video Editing</h3>
              <p className="text-gray-600 text-sm">
                Trim, cut, merge, add text overlays, apply filters, transitions, and background music
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Image Editing</h3>
              <p className="text-gray-600 text-sm">
                Crop, resize, apply filters, add text overlays, stickers, and AI enhancements
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Audio Editing</h3>
              <p className="text-gray-600 text-sm">
                Trim, merge, adjust volume, noise reduction, effects, and background music
              </p>
            </Card>
          </div>
        </div>

        {/* Demo Media */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Try the Editors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEMO_MEDIA.map((media) => (
              <Card key={media.id} className={`${getMediaColor(media.type)} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getMediaIcon(media.type)}
                    <div>
                      <CardTitle className="text-lg">{media.name}</CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {media.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {media.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      Size: {(media.size / 1024).toFixed(1)} KB
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {getFeatureList(media.type).slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <feature.icon className="w-3 h-3 mr-1" />
                          {feature.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleEditMedia(media)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Launch Editor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Editor Benefits */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Why Choose Our Advanced Editor?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Preview</h3>
              <p className="text-sm text-gray-600">
                See your edits instantly as you make them
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Advanced AI features for professional results
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Professional Tools</h3>
              <p className="text-sm text-gray-600">
                Industry-standard editing capabilities
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Easy Export</h3>
              <p className="text-sm text-gray-600">
                Multiple formats and quality options
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to Create Professional Content?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Choose any of the sample media above to experience our advanced editing tools. 
                From basic adjustments to professional-grade effects, we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => handleEditMedia(DEMO_MEDIA[0])}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Try Video Editor
                </Button>
                <Button
                  onClick={() => handleEditMedia(DEMO_MEDIA[1])}
                  size="lg"
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Try Image Editor
                </Button>
                <Button
                  onClick={() => handleEditMedia(DEMO_MEDIA[2])}
                  size="lg"
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Try Audio Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Media Editor Modal */}
      {showEditor && selectedMedia && (
        <MediaEditorLauncher
          media={{
            id: selectedMedia.id,
            file: new File([], selectedMedia.name),
            type: selectedMedia.type,
            url: selectedMedia.url,
            name: selectedMedia.name,
            size: selectedMedia.size
          }}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
