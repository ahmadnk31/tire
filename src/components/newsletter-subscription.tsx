'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const t=useTranslations('Homepage.newsletter')
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/newsletters/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, source: 'website' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setSuccess(true);
      setEmail('');
      setName('');
      toast.success('Successfully subscribed to our newsletter!');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      toast.error(err.message || 'Failed to subscribe to newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">
          {t('title')}
        </h3>
        <p className="text-white/80">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400"
          />
          <Input
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400"
          />
        </div>
        
        <div className="flex justify-center">
          <Button 
            type="submit" 
            disabled={loading || success}
            className="bg-white text-blue-800 hover:bg-blue-100 px-8 font-medium"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('subscribing')}</>
            ) : success ? (
              <><CheckCircle className="mr-2 h-4 w-4" /> {t('subscribed')}</>
            ) : (
              <>{t('subscribe')} <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="flex items-center justify-center text-red-300 text-sm mt-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{error}</span>
          </div>
        )}
        
        <p className="text-xs text-center text-white/60 mt-4">
          {t('privacyNote')}
        </p>
      </form>
    </div>
  );
}
