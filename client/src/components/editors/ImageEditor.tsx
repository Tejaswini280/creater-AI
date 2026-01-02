import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Crop, Type, Palette, RotateCcw, RotateCw, Download, Undo, Redo, 
  Eye, EyeOff, Image as ImageIcon, Zap, Sparkles, Move, Maximize, Minimize, Check
} from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImage: Blob) => void;
  onClose: () => void;
}

const FILTER_PRESETS = {
  vintage: { brightness: 0.9, contrast: 1.2, saturation: 0.8, sepia: 0.3 },
  dramatic: { brightness: 0.8, contrast: 1.4, saturation: 1.1, blur: 0.1 },
  vibrant: { brightness: 1.1, contrast: 1.1, saturation: 1.3, blur: 0 },
  noir: { brightness: 0.7, contrast: 1.5, saturation: 0.3, blur: 0.05 }
};

export default function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  console.log('🖼️ ImageEditor received imageUrl:', imageUrl);
  
  const [filters, setFilters] = useState({
    brightness: 1,
    contrast: 1,
    saturation: 1,
    blur: 0,
    sepia: 0
  });
  
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState('adjust');
  const [showPreview, setShowPreview] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Crop and resize functionality
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Stickers functionality
  const [stickers, setStickers] = useState<Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>>([]);
  
  const [textOverlays, setTextOverlays] = useState<Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
  }>>([]);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize image dimensions when image loads
  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      console.log('🖼️ Initializing image element with URL:', imageUrl);
      
      const handleLoad = () => {
        console.log('✅ Image loaded, dimensions:', img.naturalWidth, 'x', img.naturalHeight);
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      const handleError = (e: Event) => {
        console.error('❌ Image failed to load:', e);
      };
      
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
      
      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    }
  }, [imageUrl]);

  // Filter operations
  const applyFilter = useCallback((filterType: string, value: number) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const applyFilterPreset = useCallback((presetName: string) => {
    const preset = FILTER_PRESETS[presetName as keyof typeof FILTER_PRESETS];
    if (preset) {
      setFilters(prev => ({ ...prev, ...preset }));
    }
  }, []);

  // Crop and resize functionality
  const startCrop = useCallback(() => {
    setIsCropping(true);
  }, []);

  const applyCrop = useCallback(() => {
    if (imageRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set canvas size to crop dimensions
          canvas.width = cropArea.width;
          canvas.height = cropArea.height;
          
          // Draw cropped image
          ctx.drawImage(
            imageRef.current,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height,
            0, 0, cropArea.width, cropArea.height
          );
          
          // Convert to blob and update image
          canvas.toBlob((blob) => {
            if (blob) {
              const newUrl = URL.createObjectURL(blob);
              // Update the image source
              if (imageRef.current) {
                imageRef.current.src = newUrl;
              }
            }
          });
        }
      }
    }
    setIsCropping(false);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  }, [cropArea]);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  }, []);

  const resizeImage = useCallback((newWidth: number, newHeight: number) => {
    if (imageRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          ctx.drawImage(imageRef.current, 0, 0, newWidth, newHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const newUrl = URL.createObjectURL(blob);
              if (imageRef.current) {
                imageRef.current.src = newUrl;
              }
              setImageDimensions({ width: newWidth, height: newHeight });
            }
          });
        }
      }
    }
  }, []);

  // Sticker functionality
  const addSticker = useCallback((stickerType: string) => {
    const newSticker = {
      id: Date.now().toString(),
      type: stickerType,
      x: 100,
      y: 100,
      scale: 1,
      rotation: 0
    };
    setStickers(prev => [...prev, newSticker]);
  }, []);

  const updateSticker = useCallback((stickerId: string, updates: Partial<typeof stickers[0]>) => {
    setStickers(prev => prev.map(sticker => 
      sticker.id === stickerId ? { ...sticker, ...updates } : sticker
    ));
  }, []);

  const removeSticker = useCallback((stickerId: string) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== stickerId));
  }, []);

  // AI Enhancement functionality
  const applyAIEnhancement = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (imageRef.current) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Simulate AI enhancement by applying multiple filters
            // In a real implementation, this would call an AI service
            const enhancedFilters = {
              brightness: Math.min(1.2, filters.brightness * 1.1),
              contrast: Math.min(1.3, filters.contrast * 1.1),
              saturation: Math.min(1.4, filters.saturation * 1.2),
              blur: Math.max(0, filters.blur * 0.8),
              sepia: Math.max(0, filters.sepia * 0.9)
            };
            
            setFilters(enhancedFilters);
            
            // Apply sharpening effect
            const sharpeningFilter = 'contrast(1.1) saturate(1.1) brightness(1.05)';
            
            // Update the image with enhanced filters
            if (imageRef.current) {
              imageRef.current.style.filter = `
                ${sharpeningFilter}
                brightness(${enhancedFilters.brightness})
                contrast(${enhancedFilters.contrast})
                saturate(${enhancedFilters.saturation})
                blur(${enhancedFilters.blur}px)
                sepia(${enhancedFilters.sepia})
              `;
            }
            
            console.log('AI enhancement applied successfully');
          }
        }
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [filters]);

  // Rotation
  const rotateImage = useCallback((degrees: number) => {
    setRotation(prev => (prev + degrees) % 360);
  }, []);

  const resetTransform = useCallback(() => {
    setRotation(0);
    setScale(1);
    setFilters({
      brightness: 1,
      contrast: 1,
      saturation: 1,
      blur: 0,
      sepia: 0
    });
    setTextOverlays([]);
  }, []);

  // Text overlay operations
  const addTextOverlay = useCallback(() => {
    const newTextOverlay = {
      id: Date.now().toString(),
      text: 'New Text',
      x: 100,
      y: 100,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial'
    };

    setTextOverlays(prev => [...prev, newTextOverlay]);
  }, []);

  const updateTextOverlay = useCallback((overlayId: string, updates: Partial<typeof textOverlays[0]>) => {
    setTextOverlays(prev => prev.map(overlay => 
      overlay.id === overlayId ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const removeTextOverlay = useCallback((overlayId: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== overlayId));
  }, []);

  // Export functionality
  const exportImage = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (imageRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set canvas size to image size
          canvas.width = imageRef.current.naturalWidth;
          canvas.height = imageRef.current.naturalHeight;
          
          // Draw image with all applied filters and transformations
          ctx.filter = `
            brightness(${filters.brightness})
            contrast(${filters.contrast})
            saturate(${filters.saturation})
            blur(${filters.blur}px)
            sepia(${filters.sepia})
          `;
          
          ctx.drawImage(imageRef.current, 0, 0);
          
          // Apply rotation and scale
          if (rotation !== 0 || scale !== 1) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);
            ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2);
            ctx.restore();
          }
          
          // Add text overlays
          textOverlays.forEach(overlay => {
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, overlay.x, overlay.y);
          });
          
          // Add stickers (simplified - just emoji text)
          stickers.forEach(sticker => {
            ctx.save();
            ctx.translate(sticker.x, sticker.y);
            ctx.rotate((sticker.rotation * Math.PI) / 180);
            ctx.scale(sticker.scale, sticker.scale);
            ctx.font = '24px Arial';
            ctx.fillText(getStickerEmoji(sticker.type), 0, 0);
            ctx.restore();
          });
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              onSave(blob);
            }
          }, 'image/png', 0.9);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [filters, rotation, scale, textOverlays, stickers, onSave]);

  // Helper function to get sticker emoji
  const getStickerEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      star: '⭐',
      heart: '❤️',
      fire: '🔥',
      check: '✅',
      lightning: '⚡',
      crown: '👑'
    };
    return emojiMap[type] || '⭐';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold">Advanced Image Editor</h2>
              <p className="text-sm text-gray-600">Professional image editing tools</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Preview */}
          {showPreview && (
            <div className="w-1/2 border-r p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Image Preview</h3>
                  <Badge variant="secondary">
                    {Math.round(scale * 100)}%
                  </Badge>
                </div>
                
                <div className="flex-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center relative overflow-hidden">
                  <div className="relative max-w-full max-h-full">
                    <img
                      ref={imageRef}
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full max-h-full rounded object-contain"
                      onLoad={() => console.log('✅ Image loaded successfully:', imageUrl)}
                      onError={(e) => console.error('❌ Image loading error:', e)}
                      style={{
                        filter: `
                          brightness(${filters.brightness})
                          contrast(${filters.contrast})
                          saturate(${filters.saturation})
                          blur(${filters.blur}px)
                          sepia(${filters.sepia})
                        `,
                        transform: `rotate(${rotation}deg) scale(${scale})`
                      }}
                    />
                    
                    {/* Text Overlays Preview */}
                    {textOverlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className="absolute cursor-move select-none"
                        style={{
                          left: overlay.x,
                          top: overlay.y,
                          fontSize: `${overlay.fontSize}px`,
                          fontFamily: overlay.fontFamily,
                          color: overlay.color,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', overlay.id);
                        }}
                      >
                        {overlay.text}
                      </div>
                    ))}

                    {/* Stickers Preview */}
                    {stickers.map((sticker) => (
                      <div
                        key={sticker.id}
                        className="absolute cursor-move select-none"
                        style={{
                          left: sticker.x,
                          top: sticker.y,
                          transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', sticker.id);
                        }}
                      >
                        <span className="text-2xl">
                          {getStickerEmoji(sticker.type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateImage(-90)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateImage(90)}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetTransform}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Panel - Editor Tools */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} p-6 overflow-y-auto`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="adjust">Adjust</TabsTrigger>
                <TabsTrigger value="crop">Crop & Resize</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="text">Text & Stickers</TabsTrigger>
                <TabsTrigger value="effects">Effects</TabsTrigger>
              </TabsList>

              {/* Adjustments Tab */}
              <TabsContent value="adjust" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Adjustments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Brightness</Label>
                      <Slider
                        value={[filters.brightness]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('brightness', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contrast</Label>
                      <Slider
                        value={[filters.contrast]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('contrast', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Saturation</Label>
                      <Slider
                        value={[filters.saturation]}
                        min={0}
                        max={2}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('saturation', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Blur</Label>
                      <Slider
                        value={[filters.blur]}
                        min={0}
                        max={10}
                        step={0.5}
                        onValueChange={([value]) => applyFilter('blur', value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sepia</Label>
                      <Slider
                        value={[filters.sepia]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) => applyFilter('sepia', value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Crop & Resize Tab */}
              <TabsContent value="crop" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Crop & Resize</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={startCrop}
                          variant={isCropping ? "default" : "outline"}
                          disabled={isCropping}
                        >
                          <Crop className="w-4 h-4 mr-2" />
                          {isCropping ? 'Cropping...' : 'Start Crop'}
                        </Button>
                        
                        {isCropping && (
                          <>
                            <Button
                              onClick={applyCrop}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Apply Crop
                            </Button>
                            <Button
                              onClick={cancelCrop}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>

                      {isCropping && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700 mb-3">
                            Click and drag on the image to select crop area
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Crop X Position</Label>
                              <Input
                                type="number"
                                value={cropArea.x}
                                onChange={(e) => setCropArea(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Crop Y Position</Label>
                              <Input
                                type="number"
                                value={cropArea.y}
                                onChange={(e) => setCropArea(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Crop Width</Label>
                              <Input
                                type="number"
                                value={cropArea.width}
                                onChange={(e) => setCropArea(prev => ({ ...prev, width: parseInt(e.target.value) || 100 }))}
                                min="10"
                                max="100"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Crop Height</Label>
                              <Input
                                type="number"
                                value={cropArea.height}
                                onChange={(e) => setCropArea(prev => ({ ...prev, height: parseInt(e.target.value) || 100 }))}
                                min="10"
                                max="100"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Resize Image</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Width (px)</Label>
                            <Input
                              type="number"
                              placeholder="Enter width"
                              min="100"
                              max="4000"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Height (px)</Label>
                            <Input
                              type="number"
                              placeholder="Enter height"
                              min="100"
                              max="4000"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => resizeImage(800, 600)}
                          className="w-full mt-3"
                          variant="outline"
                        >
                          <Maximize className="w-4 h-4 mr-2" />
                          Resize to 800x600
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filter Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.keys(FILTER_PRESETS).map((preset) => (
                        <Button
                          key={preset}
                          variant="outline"
                          onClick={() => applyFilterPreset(preset)}
                          className="capitalize"
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Text & Stickers Tab */}
              <TabsContent value="text" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Text & Stickers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Text Overlays Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Text Overlays</h4>
                      <Button
                        onClick={addTextOverlay}
                        className="w-full"
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Add Text
                      </Button>

                      {textOverlays.map((overlay) => (
                        <div 
                          key={overlay.id} 
                          className="border rounded-lg p-3 space-y-3 border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <Label>Text {overlay.id.slice(-4)}</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTextOverlay(overlay.id)}
                            >
                              ×
                            </Button>
                          </div>
                          
                          <Input
                            value={overlay.text}
                            onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                            placeholder="Enter text..."
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Font Size</Label>
                              <Input
                                type="number"
                                value={overlay.fontSize}
                                onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                                min="8"
                                max="72"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Color</Label>
                              <Input
                                type="color"
                                value={overlay.color}
                                onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stickers Section */}
                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium">Stickers</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => addSticker('star')}
                          variant="outline"
                          size="sm"
                          className="h-16 flex-col"
                        >
                          <span className="text-2xl">⭐</span>
                          <span className="text-xs">Star</span>
                        </Button>
                        <Button
                          onClick={() => addSticker('heart')}
                          variant="outline"
                          size="sm"
                          className="h-16 flex-col"
                        >
                          <span className="text-2xl">❤️</span>
                          <span className="text-xs">Heart</span>
                        </Button>
                        <Button
                          onClick={() => addSticker('fire')}
                          variant="outline"
                          size="sm"
                          className="h-16 flex-col"
                        >
                          <span className="text-2xl">🔥</span>
                          <span className="text-xs">Fire</span>
                        </Button>
                        <Button
                          onClick={() => addSticker('check')}
                          variant="outline"
                          size="sm"
                          className="h-16 flex-col"
                        >
                          <span className="text-2xl">✅</span>
                          <span className="text-xs">Check</span>
                        </Button>
                        <Button
                          onClick={() => addSticker('lightning')}
                          variant="outline"
                          size="sm"
                          className="h-16 flex-col"
                        >
                          <span className="text-2xl">⚡</span>
                          <span className="text-xs">Lightning</span>
                        </Button>
                        <Button
                          onClick={() => addSticker('crown')}
                          variant="outline"
                          size="sm"
                          className="h-16 flex-col"
                        >
                          <span className="text-2xl">👑</span>
                          <span className="text-xs">Crown</span>
                        </Button>
                      </div>

                      {stickers.map((sticker) => (
                        <div 
                          key={sticker.id} 
                          className="border rounded-lg p-3 space-y-3 border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <Label>Sticker {sticker.id.slice(-4)}</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSticker(sticker.id)}
                            >
                              ×
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Scale</Label>
                              <Slider
                                value={[sticker.scale]}
                                min={0.1}
                                max={3}
                                step={0.1}
                                onValueChange={([value]) => updateSticker(sticker.id, { scale: value })}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Rotation</Label>
                              <Slider
                                value={[sticker.rotation]}
                                min={0}
                                max={360}
                                step={1}
                                onValueChange={([value]) => updateSticker(sticker.id, { rotation: value })}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Effects Tab */}
              <TabsContent value="effects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Enhancements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={applyAIEnhancement}
                      className="w-full"
                      variant="outline"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Auto-Enhance
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer - Export Controls */}
        <div className="border-t p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ready to export
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              
              <Button
                onClick={exportImage}
                disabled={isProcessing}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
