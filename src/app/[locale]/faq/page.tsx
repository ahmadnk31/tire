'use client'

import { useTranslations } from 'next-intl'
import { Breadcrumb } from '@/components/breadcrumb'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function FAQPage() {
  const t = useTranslations('FAQ')

  // Define FAQ categories
  const categories = ['general', 'tires', 'services', 'shipping', 'warranty', 'payment']

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: t('common.home'), href: '/' },
          { label: t('title'), href: '/faq' },
        ]}
      />

      <div className="my-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder')}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{t('search.tip')}</p>
        </div>

        {/* FAQ Categories */}
        <Tabs defaultValue="general" className="mb-12">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto mb-8">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="py-2">
                {t(`categories.${category}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6">{t(`categories.${category}`)}</h2>
                
                <Accordion type="single" collapsible className="w-full">
                  {[1, 2, 3, 4, 5].map((qIndex) => (
                    <AccordionItem key={qIndex} value={`item-${qIndex}`}>
                      <AccordionTrigger className="text-left">
                        {t(`questions.${category}.q${qIndex}.question`)}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4">
                          <p>{t(`questions.${category}.q${qIndex}.answer`)}</p>
                          
                          {/* Links to related content, if available */}
                          {qIndex % 3 === 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-sm font-medium mb-2">{t('relatedLinks')}:</p>
                              <div className="flex flex-wrap gap-2">
                                <Button variant="link" size="sm" asChild className="h-auto p-0">
                                  <Link href="/services">
                                    {t('relatedServices')}
                                  </Link>
                                </Button>
                                <span className="text-muted-foreground">•</span>
                                <Button variant="link" size="sm" asChild className="h-auto p-0">
                                  <Link href="/warranty">
                                    {t('relatedWarranty')}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Still have questions section */}
        <div className="bg-muted p-8 rounded-lg mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('stillHaveQuestions.title')}</h2>
            <p className="mb-6">{t('stillHaveQuestions.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">{t('stillHaveQuestions.contactUs')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={`tel:${t('stillHaveQuestions.phoneNumber')}`}>
                  {t('stillHaveQuestions.callUs')}
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">{t('quickLinks.title')}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {['shipping', 'returns', 'warranty'].map((link) => (
              <div key={link} className="border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">{t(`quickLinks.${link}.title`)}</h3>
                <p className="text-muted-foreground mb-4">{t(`quickLinks.${link}.description`)}</p>
                <Button variant="outline" asChild>
                  <Link href={`/${link}`}>{t(`quickLinks.${link}.linkText`)}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
