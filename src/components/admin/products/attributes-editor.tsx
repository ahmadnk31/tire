'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Attribute = {
  id: string;
  key: string;
  value: string;
};

interface AttributesEditorProps {
  value: Record<string, string> | null;
  onChange: (attributes: Record<string, string>) => void;
  suggestions?: string[];
  disabled?: boolean;
}

export function AttributesEditor({ 
  value, 
  onChange, 
  suggestions = [
    'Material', 'Tread Life', 'Wet Traction', 'Dry Traction', 'Snow Traction', 
    'Comfort Level', 'Noise Level', 'Fuel Efficiency', 'Rolling Resistance',
    'Speed Rating', 'Load Range', 'Sidewall Style', 'Rim Protection'
  ],
  disabled = false 
}: AttributesEditorProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);  // Initialize attributes from value prop with improved handling
  useEffect(() => {
    try {
      if (value && Object.keys(value).length > 0) {
        const initialAttributes = Object.entries(value).map(([key, value]) => ({
          id: Math.random().toString(36).substring(2),
          key,
          value: String(value)
        }));
        setAttributes(initialAttributes);
      } else {
        // Initialize with a single empty attribute if there are no attributes
        setAttributes([{
          id: Math.random().toString(36).substring(2),
          key: '',
          value: ''
        }]);
      }
    } catch (error) {
      console.error("Error initializing attributes:", error);
      // Fallback to an empty attribute
      setAttributes([{
        id: Math.random().toString(36).substring(2),
        key: '',
        value: ''
      }]);
    }
  }, [value]);

  // Helper to convert attributes array to record object
  const attributesToRecord = (attrs: Attribute[]): Record<string, string> => {
    return attrs.reduce((acc, { key, value }) => {
      if (key.trim()) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);
  };

  // Add a new attribute
  const addAttribute = () => {
    const newAttributes = [
      ...attributes,
      { id: Math.random().toString(36).substring(2), key: '', value: '' }
    ];
    
    setAttributes(newAttributes);
    onChange(attributesToRecord(newAttributes));
  };

  // Add a suggested attribute
  const addSuggestion = (suggestion: string) => {
    // Check if suggestion already exists
    const exists = attributes.some(attr => attr.key.toLowerCase() === suggestion.toLowerCase());
    
    if (!exists) {
      const newAttributes = [
        ...attributes,
        { id: Math.random().toString(36).substring(2), key: suggestion, value: '' }
      ];
      
      setAttributes(newAttributes);
      onChange(attributesToRecord(newAttributes));
    }
    
    setShowSuggestions(false);
  };

  // Remove an attribute
  const removeAttribute = (id: string) => {
    const newAttributes = attributes.filter(attr => attr.id !== id);
    setAttributes(newAttributes);
    onChange(attributesToRecord(newAttributes));
  };

  // Update attribute key
  const updateKey = (id: string, key: string) => {
    const newAttributes = attributes.map(attr => 
      attr.id === id ? { ...attr, key } : attr
    );
    setAttributes(newAttributes);
    onChange(attributesToRecord(newAttributes));
  };

  // Update attribute value
  const updateValue = (id: string, value: string) => {
    const newAttributes = attributes.map(attr => 
      attr.id === id ? { ...attr, value } : attr
    );
    setAttributes(newAttributes);
    onChange(attributesToRecord(newAttributes));
  };
  return (
    <div className="space-y-4 attributes-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Product Attributes</h3>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            disabled={disabled}
          >
            Suggestions
          </Button>
          <Button 
            type="button" 
            variant="default" 
            size="sm"
            onClick={addAttribute}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Attribute
          </Button>
        </div>
      </div>
      
      {showSuggestions && (
        <Card className="p-2">
          <CardContent className="flex flex-wrap gap-2 p-2">
            {suggestions.map(suggestion => (
              <Badge 
                key={suggestion} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => addSuggestion(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </CardContent>
        </Card>      )}
      
      {attributes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
          No attributes defined. Add attributes to provide specific details about this product.
        </div>
      ) : (        <div className="space-y-3">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="flex items-center gap-3 key-value-pair p-2 border rounded-md bg-white">
              <Input
                value={attribute.key}
                onChange={(e) => updateKey(attribute.id, e.target.value)}
                placeholder="Attribute name"
                className="flex-1"
                disabled={disabled}
              />
              <Input
                value={attribute.value}
                onChange={(e) => updateValue(attribute.id, e.target.value)}
                placeholder="Value"
                className="flex-1"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeAttribute(attribute.id)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 