'use client';

import  { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';



import { Button } from '@/components/ui/button';
import { Plus, Globe, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditorAdapter as RichTextEditor } from '@/components/ui/react-quill-adapter';
import { FullRichTextEditor } from '@/components/ui/full-rich-text-adapter';
import React from 'react';

// Define the available languages
// We'll use ISO 639-1 language codes
const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }
];

export type LocalizedContent = {
  [langCode: string]: string;
};

interface LocalizedEditorProps {
  value: LocalizedContent;
  onChange: (value: LocalizedContent) => void;
  defaultLanguage?: string;
  useRichText?: boolean;
  fullRichText?: boolean;
  label?: string;
  placeholder?: string;
  height?: string;
  minHeight?: string;
}

export function LocalizedEditor({
  value = {},
  onChange,
  defaultLanguage = 'en',
  useRichText = true,
  fullRichText = false,
  label = 'Content',
  placeholder = 'Enter content...',
  height = '250px',
  minHeight = '150px',
}: LocalizedEditorProps) {  
  // Create a safe copy of the value object to avoid mutations
  const [localizedContentState, setLocalizedContentState] = React.useState<LocalizedContent>({});
  
  // Currently active language tab - declare this first before using it in useEffects
  const [activeLanguage, setActiveLanguage] = useState(defaultLanguage);
  
  // Get all available languages from our local state
  const availableLanguages = React.useMemo(() => {
    const langs = Object.keys(localizedContentState);
    if (!langs.includes(defaultLanguage)) {
      langs.push(defaultLanguage);
    }
    return langs;
  }, [localizedContentState, defaultLanguage]);
  // Use useEffect to handle changes to the value prop
  React.useEffect(() => {
    // Create a new value object with the default language initialized
    const newValue = { ...value };
    
    // Ensure default language is available
    if (!newValue[defaultLanguage]) {
      newValue[defaultLanguage] = '';
    }
    
    // We only want to use stringified comparison for the value objects,
    // not include localizedContentState in dependencies directly
    const currentValueStr = JSON.stringify(newValue);
    const prevValueStr = JSON.stringify(localizedContentState);
    
    if (currentValueStr !== prevValueStr) {
      // Use a small timeout to ensure this doesn't interfere with any ongoing edits
      // This prevents losing focus when the parent component updates its state
      setLocalizedContentState(prevState => {
        // Preserve any values in the current state that aren't in the new value
        return { ...newValue };
      });
      
      // If current active language isn't available in the new content,
      // switch to default language
      if (!Object.keys(newValue).includes(activeLanguage)) {
        setActiveLanguage(defaultLanguage);
      }
    }
  }, [value, defaultLanguage, activeLanguage]);
    // Ensure active language is valid when available languages change
  React.useEffect(() => {
    // When component mounts or available languages change,
    // make sure the active language is valid
    if (availableLanguages.length > 0 && !availableLanguages.includes(activeLanguage)) {
      setActiveLanguage(defaultLanguage);
    }
  }, [availableLanguages, activeLanguage, defaultLanguage]);
  
  // State for adding a new language
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  
  // Get remaining languages that can be added
  const remainingLanguages = AVAILABLE_LANGUAGES.filter(
    (lang) => !availableLanguages.includes(lang.code)
  );  // Handle content change for a specific language
  const handleContentChange = (langCode: string, content: string) => {
    // Create a new content object with the updated value
    const newValue = { 
      ...localizedContentState, 
      [langCode]: content 
    };
    
    // Update local state first
    setLocalizedContentState(newValue);
    
    // Notify parent component of the change
    onChange(newValue);
  };  // Add a new language
  const handleAddLanguage = () => {
    if (newLanguageCode && !availableLanguages.includes(newLanguageCode)) {
      // Add the new language with empty content
      const newValue = { ...localizedContentState, [newLanguageCode]: '' };
      
      // First close the dialog to avoid visual jank
      setIsAddingLanguage(false);
      
      // Use a small timeout to ensure smooth UI transition and avoid focus issues
      setTimeout(() => {
        // Update local state
        setLocalizedContentState(newValue);
        
        // Notify parent component
        onChange(newValue);
        
        // Switch to the new language tab
        setActiveLanguage(newLanguageCode);
        
        // Reset the new language code
        setNewLanguageCode('');
      }, 50);
    }
  };

  // Get language name from code
  const getLanguageName = (code: string) => {
    return AVAILABLE_LANGUAGES.find((lang) => lang.code === code)?.name || code;
  };
  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}      {/* Add optional debugging - you can comment this out for production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs mb-1 text-muted-foreground">
          <span>Editor Debug: </span>
          <span className="font-mono">Active={activeLanguage}, </span>
          <span className="font-mono">Languages=[{availableLanguages.join(',')}]</span>
        </div>
      )}
      
      <div className="border rounded-md">
        <Tabs 
          value={activeLanguage} 
          onValueChange={(lang) => {
            // Add debug when switching languages
            if (process.env.NODE_ENV === 'development') {
              console.log(`Switching language from ${activeLanguage} to ${lang}`);
            }
            setActiveLanguage(lang);
          }} 
          className="w-full"
          defaultValue={defaultLanguage}
        >
          <div className="flex items-center justify-between border-b px-2 py-1">
            <div className="flex items-center overflow-x-auto">
              <TabsList>
                {availableLanguages.map((langCode) => (
                  <TabsTrigger 
                    key={langCode} 
                    value={langCode} 
                    className="flex items-center gap-1"
                  >
                    <Badge variant={langCode === defaultLanguage ? "default" : "outline"} className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {langCode.toUpperCase().substring(0, 2)}
                    </Badge>
                    <span className="hidden sm:inline">{getLanguageName(langCode)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {remainingLanguages.length > 0 && (
                <Dialog open={isAddingLanguage} onOpenChange={setIsAddingLanguage}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full ml-2">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Language</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="language-select">Select Language</Label>
                      <Select value={newLanguageCode} onValueChange={setNewLanguageCode}>
                        <SelectTrigger id="language-select" className="mt-2">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          {remainingLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleAddLanguage} disabled={!newLanguageCode}>
                        Add Language
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>          </div>            {availableLanguages.map((langCode) => (
            <TabsContent 
              key={langCode} 
              value={langCode} 
              className="p-0"
            >
              {useRichText ? (
                // Use a stable key based only on the language code to prevent focus loss
                <React.Fragment>
                  {fullRichText ? (
                    <div className="border-0 overflow-hidden">
                      <FullRichTextEditor
                        key={`full-editor-${langCode}`}
                        value={localizedContentState[langCode] || ''}
                        onChange={(content) => handleContentChange(langCode, content)}
                        placeholder={`${placeholder} (${getLanguageName(langCode)})`}
                        height={height}
                        className="localized-full-rich-text-editor"
                      />
                    </div>
                  ) : (
                    <div className="border-0 overflow-hidden">
                      <RichTextEditor
                        key={`simple-editor-${langCode}`}
                        value={localizedContentState[langCode] || ''}
                        onChange={(content) => handleContentChange(langCode, content)}
                        placeholder={`${placeholder} (${getLanguageName(langCode)})`}
                        height={height}
                        hideToolbar={activeLanguage !== langCode} // Hide toolbar for inactive tabs
                      />
                    </div>
                  )}
                </React.Fragment>
              ) : (
                // Simple textarea is more reliable
                <Textarea
                  value={localizedContentState[langCode] || ''}
                  onChange={(e) => handleContentChange(langCode, e.target.value)}
                  placeholder={`${placeholder} (${getLanguageName(langCode)})`}
                  className="border-0 resize-none"
                  style={{ minHeight }}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <div className="flex items-center text-xs text-muted-foreground gap-1">
        <Globe className="h-3 w-3" />
        <span>
          {availableLanguages.length} language{availableLanguages.length !== 1 ? 's' : ''} available
        </span>
      </div>
    </div>
  );
} 