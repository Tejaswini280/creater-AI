import HashtagPicker from '../components/social-media/HashtagPicker';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function TestHashtags() {
  const [, setLocation] = useLocation();
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok'>('instagram');

  const platforms = [
    { value: 'instagram', label: 'Instagram', color: 'text-pink-600' },
    { value: 'facebook', label: 'Facebook', color: 'text-blue-600' },
    { value: 'linkedin', label: 'LinkedIn', color: 'text-blue-700' },
    { value: 'youtube', label: 'YouTube', color: 'text-red-600' },
    { value: 'tiktok', label: 'TikTok', color: 'text-black' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hashtag Picker Test</h1>
              <p className="text-gray-600">Test the enhanced hashtag suggestion functionality</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Platform Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Platform</h2>
            <div className="flex flex-wrap gap-3">
              {platforms.map((platform) => (
                <Button
                  key={platform.value}
                  variant={selectedPlatform === platform.value ? 'default' : 'outline'}
                  onClick={() => setSelectedPlatform(platform.value as any)}
                  className={`${selectedPlatform === platform.value ? '' : platform.color}`}
                >
                  {platform.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Hashtag Picker Component */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <HashtagPicker
            selectedHashtags={selectedHashtags}
            onHashtagsChange={setSelectedHashtags}
            platform={selectedPlatform}
            maxHashtags={30}
          />
        </div>

        {/* Selected Hashtags Summary */}
        {selectedHashtags.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Hashtags Summary</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Platform:</strong> {platforms.find(p => p.value === selectedPlatform)?.label}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total Selected:</strong> {selectedHashtags.length}/30
              </p>
              <p className="text-sm text-gray-600">
                <strong>Hashtags:</strong> {selectedHashtags.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
