import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Hash,
  TrendingUp,
  Search,
  Plus,
  X,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Sparkles
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface Hashtag {
  tag: string;
  trendScore: number;
  usageCount: number;
  category: string;
}

interface HashtagPickerProps {
  selectedHashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';
  maxHashtags?: number;
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { value: 'tiktok', label: 'TikTok', color: 'text-black' },
];

// Mock trending hashtags data - in real app, this would come from API
const TRENDING_HASHTAGS: Record<string, Hashtag[]> = {
  instagram: [
    { tag: '#trending', trendScore: 95, usageCount: 1500000, category: 'general' },
    { tag: '#viral', trendScore: 92, usageCount: 1200000, category: 'general' },
    { tag: '#fyp', trendScore: 90, usageCount: 1000000, category: 'general' },
    { tag: '#instagram', trendScore: 88, usageCount: 800000, category: 'platform' },
    { tag: '#socialmedia', trendScore: 85, usageCount: 600000, category: 'business' },
    { tag: '#photography', trendScore: 82, usageCount: 500000, category: 'creative' },
    { tag: '#lifestyle', trendScore: 80, usageCount: 400000, category: 'lifestyle' },
    { tag: '#fashion', trendScore: 78, usageCount: 350000, category: 'fashion' },
    { tag: '#food', trendScore: 75, usageCount: 300000, category: 'food' },
    { tag: '#travel', trendScore: 73, usageCount: 250000, category: 'travel' },
  ],
  facebook: [
    { tag: '#facebook', trendScore: 90, usageCount: 800000, category: 'platform' },
    { tag: '#social', trendScore: 85, usageCount: 600000, category: 'general' },
    { tag: '#community', trendScore: 82, usageCount: 500000, category: 'community' },
    { tag: '#friends', trendScore: 80, usageCount: 400000, category: 'social' },
    { tag: '#family', trendScore: 78, usageCount: 350000, category: 'social' },
    { tag: '#news', trendScore: 75, usageCount: 300000, category: 'news' },
    { tag: '#events', trendScore: 73, usageCount: 250000, category: 'events' },
    { tag: '#business', trendScore: 70, usageCount: 200000, category: 'business' },
  ],
  linkedin: [
    { tag: '#linkedin', trendScore: 88, usageCount: 600000, category: 'platform' },
    { tag: '#professional', trendScore: 85, usageCount: 500000, category: 'career' },
    { tag: '#business', trendScore: 82, usageCount: 400000, category: 'business' },
    { tag: '#career', trendScore: 80, usageCount: 350000, category: 'career' },
    { tag: '#networking', trendScore: 78, usageCount: 300000, category: 'networking' },
    { tag: '#leadership', trendScore: 75, usageCount: 250000, category: 'leadership' },
    { tag: '#innovation', trendScore: 73, usageCount: 200000, category: 'innovation' },
    { tag: '#technology', trendScore: 70, usageCount: 150000, category: 'technology' },
  ],
  youtube: [
    { tag: '#youtube', trendScore: 90, usageCount: 1000000, category: 'platform' },
    { tag: '#video', trendScore: 88, usageCount: 800000, category: 'content' },
    { tag: '#content', trendScore: 85, usageCount: 600000, category: 'content' },
    { tag: '#subscribe', trendScore: 82, usageCount: 500000, category: 'engagement' },
    { tag: '#trending', trendScore: 80, usageCount: 400000, category: 'general' },
    { tag: '#gaming', trendScore: 78, usageCount: 350000, category: 'gaming' },
    { tag: '#music', trendScore: 75, usageCount: 300000, category: 'music' },
    { tag: '#tutorial', trendScore: 73, usageCount: 250000, category: 'education' },
  ],
  tiktok: [
    { tag: '#tiktok', trendScore: 92, usageCount: 1200000, category: 'platform' },
    { tag: '#fyp', trendScore: 90, usageCount: 1000000, category: 'general' },
    { tag: '#viral', trendScore: 88, usageCount: 800000, category: 'general' },
    { tag: '#trending', trendScore: 85, usageCount: 600000, category: 'general' },
    { tag: '#foryou', trendScore: 82, usageCount: 500000, category: 'general' },
    { tag: '#dance', trendScore: 80, usageCount: 400000, category: 'entertainment' },
    { tag: '#comedy', trendScore: 78, usageCount: 350000, category: 'entertainment' },
    { tag: '#challenge', trendScore: 75, usageCount: 300000, category: 'challenge' },
  ],
};

const CATEGORIES = {
  general: 'General',
  platform: 'Platform',
  business: 'Business',
  creative: 'Creative',
  lifestyle: 'Lifestyle',
  fashion: 'Fashion',
  food: 'Food',
  travel: 'Travel',
  social: 'Social',
  community: 'Community',
  news: 'News',
  events: 'Events',
  career: 'Career',
  networking: 'Networking',
  leadership: 'Leadership',
  innovation: 'Innovation',
  technology: 'Technology',
  content: 'Content',
  engagement: 'Engagement',
  gaming: 'Gaming',
  music: 'Music',
  education: 'Education',
  entertainment: 'Entertainment',
  challenge: 'Challenge',
};

export default function HashtagPicker({
  selectedHashtags,
  onHashtagsChange,
  platform,
  maxHashtags = 30
}: HashtagPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTrending, setShowTrending] = useState(true);

  const platformData = PLATFORMS.find(p => p.value === platform);
  const platformHashtags = TRENDING_HASHTAGS[platform] || [];

  const filteredHashtags = platformHashtags.filter(hashtag => {
    const matchesSearch = hashtag.tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || hashtag.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedHashtags = filteredHashtags.sort((a, b) => b.trendScore - a.trendScore);

  const addHashtag = (hashtag: string) => {
    if (selectedHashtags.length >= maxHashtags) {
      return; // Don't add if max reached
    }
    
    const formattedHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    if (!selectedHashtags.includes(formattedHashtag)) {
      onHashtagsChange([...selectedHashtags, formattedHashtag]);
    }
  };

  const removeHashtag = (hashtag: string) => {
    onHashtagsChange(selectedHashtags.filter(h => h !== hashtag));
  };

  const handleCustomHashtag = (value: string) => {
    if (value.trim() && value.includes(' ')) {
      const hashtags = value.split(' ').filter(word => word.trim());
      hashtags.forEach(tag => {
        if (tag.startsWith('#') && !selectedHashtags.includes(tag)) {
          addHashtag(tag);
        }
      });
      setSearchTerm('');
    }
  };

  const getTrendingBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-red-100 text-red-800';
    if (score >= 80) return 'bg-orange-100 text-orange-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Selected Hashtags Display */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">
            Selected Hashtags ({selectedHashtags.length}/{maxHashtags})
          </Label>
          {selectedHashtags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHashtagsChange([])}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          )}
        </div>
        
        {selectedHashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedHashtags.map((hashtag) => (
              <Badge
                key={hashtag}
                variant="secondary"
                className="cursor-pointer hover:bg-red-100 group"
                onClick={() => removeHashtag(hashtag)}
              >
                {hashtag}
                <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-2">
            No hashtags selected. Add some to increase your post's discoverability!
          </div>
        )}
      </div>

      {/* Custom Hashtag Input */}
      <div>
        <Label className="text-sm font-medium">Add Custom Hashtag</Label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="Type hashtags separated by spaces (e.g., #mybrand #product)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomHashtag(searchTerm);
              }
            }}
          />
          <Button
            onClick={() => handleCustomHashtag(searchTerm)}
            disabled={!searchTerm.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Trending Hashtags */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Trending Hashtags for {platformData?.label}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTrending(!showTrending)}
            >
              {showTrending ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>

        {showTrending && (
          <CardContent className="space-y-4">
            {/* Category Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Filter by Category</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(key)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Search Hashtags</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search trending hashtags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Hashtags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {sortedHashtags.map((hashtag) => (
                <div
                  key={hashtag.tag}
                  className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                    selectedHashtags.includes(hashtag.tag) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => addHashtag(hashtag.tag)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-blue-600">{hashtag.tag}</span>
                    <Badge className={getTrendingBadgeColor(hashtag.trendScore)}>
                      {hashtag.trendScore}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{CATEGORIES[hashtag.category as keyof typeof CATEGORIES]}</span>
                    <span>{hashtag.usageCount.toLocaleString()} uses</span>
                  </div>

                  {selectedHashtags.includes(hashtag.tag) && (
                    <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                      <Plus className="w-3 h-3" />
                      Added
                    </div>
                  )}
                </div>
              ))}
            </div>

            {sortedHashtags.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Hash className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hashtags found</p>
                <p className="text-sm">Try adjusting your search or category filter</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Hashtag Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
            <Sparkles className="h-4 w-4" />
            Hashtag Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Use 3-5 hashtags for optimal engagement</p>
          <p>• Mix popular and niche hashtags</p>
          <p>• Research trending hashtags in your industry</p>
          <p>• Avoid overused or spammy hashtags</p>
          <p>• Create branded hashtags for your business</p>
        </CardContent>
      </Card>
    </div>
  );
}
