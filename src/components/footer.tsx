'use client'

import { useTranslations } from 'next-intl'

import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { Link } from '@/i18n/navigation'
import { CreatedBy } from './created-by'
import { IconBrandTiktok } from '@tabler/icons-react'

export function Footer() {
  const t = useTranslations('Footer')

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
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">{t('newsletter.title')}</h3>
            <p className="text-slate-300">{t('newsletter.description')}</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder={t('newsletter.placeholder')} 
                className="bg-slate-800 border-slate-700 text-white" 
              />
              <Button type="submit" variant="default">{t('newsletter.button')}</Button>
            </div>
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
