import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Image as ImageIcon, Check, X, MessageSquare, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AIDescriptionGeneratorProps {
  productId?: string;
  onDescriptionGenerated?: (description: string) => void;
  initialDescription?: string;
}

export function AIDescriptionGenerator({
  productId,
  onDescriptionGenerated,
  initialDescription = '',
}: AIDescriptionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState(initialDescription);
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size exceeds 5MB limit');
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDescription = async () => {
    if (!image) {
      toast.error('Please upload an image first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    
    if (productId) {
      formData.append('productId', productId);
    }
    
    if (useCustomPrompt && customPrompt.trim()) {
      formData.append('initialPrompt', customPrompt);
    }

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      setDescription(data.description);
      setProcessingTime(data.processingTimeMs || null);
      
      if (onDescriptionGenerated) {
        onDescriptionGenerated(data.description);
      }
      
      toast.success('Successfully generated product description');
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast.error(error.message || 'Failed to generate description');
    } finally {
      setLoading(false);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Description Generator
        </CardTitle>
        <CardDescription>
          Upload a tire image to generate a detailed product description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div 
              onClick={triggerFileUpload}
              className={`border-2 border-dashed rounded-lg p-4 h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                imagePreview ? 'border-transparent' : 'border-gray-300 hover:border-blue-500'
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
              
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img
                    src={imagePreview}
                    alt="Tire preview"
                    className="w-full h-full object-contain rounded-md"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearImage();
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Click to upload a tire image</p>
                  <p className="text-xs text-gray-400">JPEG, PNG or WebP (max 5MB)</p>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-prompt"
                checked={useCustomPrompt}
                onCheckedChange={setUseCustomPrompt}
              />
              <Label htmlFor="custom-prompt">Use custom prompt</Label>
            </div>
            
            {useCustomPrompt && (
              <Textarea
                placeholder="Enter your custom prompt for the AI. Be specific about what tire features to highlight."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="h-28"
              />
            )}
            
            <Button
              onClick={handleGenerateDescription}
              disabled={loading || !image}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Generate Description
                </>
              )}
            </Button>
            
            {processingTime !== null && (
              <p className="text-xs text-gray-500 text-right">
                Generated in {(processingTime / 1000).toFixed(2)}s
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="generated-description">Generated Description</Label>
            <Textarea
              id="generated-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AI-generated description will appear here..."
              className="h-[calc(100%-2rem)] min-h-[300px]"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-xs text-gray-500">
          Powered by AI vision analysis technology
        </p>
        {onDescriptionGenerated && description && (
          <Button variant="outline" onClick={() => onDescriptionGenerated(description)}>
            <Check className="h-4 w-4 mr-2" />
            Use This Description
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 