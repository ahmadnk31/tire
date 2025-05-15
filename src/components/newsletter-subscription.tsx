'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, ArrowRight, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const t = useTranslations('Homepage.newsletter');
  const locale = useLocale();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [error, setError] = useState('');
  
  // Reset success state after 5 seconds to allow resubmission
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFeedbackMessage('');

    try {
      const response = await fetch('/api/newsletters/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': selectedLocale,
        },
        body: JSON.stringify({ 
          email, 
          name, 
          source: 'website', 
          preferredLanguage: selectedLocale,
          csrfToken: 'dummy-token' // In a real app, you would use a proper CSRF token
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setSuccess(true);
      setEmail('');
      setName('');
      setFeedbackMessage(data.message || t('subscribeSuccess') || 'Successfully subscribed to our newsletter!');
      toast.success(data.message || t('subscribeSuccess') || 'Successfully subscribed to our newsletter!');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      toast.error(err.message || 'Failed to subscribe to newsletter');
    } finally {
      setLoading(false);
    }
  };

  const handleLocaleChange = (newLocale: string) => {
    setSelectedLocale(newLocale);
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">
          {t('title')}
        </h3>
        <p className="text-white/80">
          {t('subtitle')}
        </p>
      </div>

      {/* Language selector */}
      <div className="absolute top-0 right-0 md:right-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
              <Globe className="h-5 w-5" />
              <span className="sr-only">Select language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleLocaleChange('en')}
              className={selectedLocale === 'en' ? 'bg-accent font-medium' : ''}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLocaleChange('nl')}
              className={selectedLocale === 'nl' ? 'bg-accent font-medium' : ''}
            >
              Nederlands
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={`transition-all duration-300 ${success ? 'scale-100 opacity-100' : 'scale-95 opacity-0 hidden'}`}>
        <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-6 mb-4 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-white font-medium text-lg">{feedbackMessage}</p>
          <Button 
            variant="outline" 
            onClick={() => setSuccess(false)} 
            className="mt-4 text-white border-white/20 hover:bg-white/10 hover:text-white"
          >
            Subscribe again
          </Button>
        </div>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className={`space-y-4 transition-all duration-300 ${success ? 'scale-95 opacity-0 hidden' : 'scale-100 opacity-100'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 pr-10 h-12"
            />
            {name && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="relative">
            <Input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 pr-10 h-12"
            />
            {email && email.includes('@') && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-white text-blue-800 hover:bg-blue-100 px-8 font-medium h-12 transition-all duration-200 hover:scale-105"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('subscribing')}</>
            ) : (
              <>{t('subscribe')} <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="flex items-center justify-center text-red-300 text-sm mt-2 bg-red-500/10 p-2 rounded-md">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="text-center text-xs text-white/60 mt-4 bg-white/5 p-3 rounded-md">
          {t('privacyNote')}
        </div>
      </form>
    </div>
  );
}
