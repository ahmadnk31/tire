'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

import { Phone, Mail, MapPin, Facebook, Instagram, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { Link } from '@/i18n/navigation'
import { CreatedBy } from './created-by'
import { IconBrandTiktok } from '@tabler/icons-react'
import { toast } from 'sonner'

export function Footer() {
  const t = useTranslations('Footer')
  const locale = useLocale()
  
  // Newsletter subscription state
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // Handle newsletter form submission
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/newsletters/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
        },
        body: JSON.stringify({
          email,
          source: 'footer',
          preferredLanguage: locale,
          csrfToken: 'dummy-token' // In a real app, use a proper CSRF token
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setSuccess(true)
      setEmail('')
      toast.success(t('newsletter.successToast'))
      
    } catch (err: any) {
      setError(err.message || t('newsletter.error'))
      console.error('Newsletter subscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-slate-900 text-slate-200">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">{t('companyName')}</h3>
            <p className="text-slate-300">{t('companySlogan')}</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+32 467662197</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@arianabandencentralebv.be</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{t('address')}</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">{t('quickLinks.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                  {t('quickLinks.about')}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-300 hover:text-white transition-colors">
                  {t('quickLinks.services')}
                </Link>
              </li>
              <li>
                <Link href="/tire-finder" className="text-slate-300 hover:text-white transition-colors">
                  {t('quickLinks.tireFinder')}
                </Link>
              </li>
              <li>
                <Link href="/installation" className="text-slate-300 hover:text-white transition-colors">
                  {t('quickLinks.installation')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">
                  {t('quickLinks.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">{t('customerService.title')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-slate-300 hover:text-white transition-colors">
                  {t('customerService.faq')}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-slate-300 hover:text-white transition-colors">
                  {t('customerService.shipping')}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-slate-300 hover:text-white transition-colors">
                  {t('customerService.returns')}
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-slate-300 hover:text-white transition-colors">
                  {t('customerService.warranty')}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-slate-300 hover:text-white transition-colors">
                  {t('customerService.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">{t('newsletter.title')}</h3>
            <p className="text-slate-300">{t('newsletter.description')}</p>
            
            {success ? (
              <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded p-3 text-center">
                <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                <p className="text-white text-sm">{t('newsletter.success')}</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-xs text-primary hover:text-white transition-colors mt-1"
                >
                  {t('newsletter.subscribeAgain')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('newsletter.placeholder')} 
                      className="bg-slate-800 border-slate-700 text-white pr-8" 
                      required
                    />
                    {email && email.includes('@') && (
                      <CheckCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Button type="submit" variant="default" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t('newsletter.button')
                    )}
                  </Button>
                </div>
                
                {error && (
                  <div className="flex items-center text-red-300 text-xs bg-red-500/10 p-2 rounded-md">
                    <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Social Media Icons */}
        <div className="mt-10 flex flex-col items-center">
          <div className="flex space-x-4 mb-4">
            <a href="https://facebook.com/ahmad.nekzad.754" 
            target='_blank' rel="noopener noreferrer"
            className="text-slate-300 hover:text-primary transition-colors">
              <Facebook className="h-6 w-6" />
              <span className="sr-only">Facebook</span>
            </a>
            <a href="https://instagram.com/amirjan.nekzad" 
            target='_blank' rel="noopener noreferrer"
            className="text-slate-300 hover:text-primary transition-colors">
              <Instagram className="h-6 w-6" />
              <span className="sr-only">Instagram</span>
            </a>
            <a href="https://www.tiktok.com/@arianabanden?_t=ZN-8wKpLsKpO8V&_r=1" className="text-slate-300 hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">
              <IconBrandTiktok className="h-6 w-6" />
              <span className="sr-only">TikTok</span>
            </a>
    
          </div>
        </div>

        <Separator className="my-6 bg-slate-700" />

        {/* Copyright Info */}
        <div className="text-center text-sm text-slate-400">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
      <CreatedBy />
    </footer>
  )
}
