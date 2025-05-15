'use client'

import { useTranslations } from 'next-intl'
import { Breadcrumb,BreadcrumbItem,BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { 
  Lock, 
  Eye, 
  Database, 
  Server, 
  UserCheck, 
  Cookie, 
  AlertTriangle,
  Mail 
} from 'lucide-react'

export default function PrivacyPolicyPage() {
  const t = useTranslations('PrivacyPolicy')
  const lastUpdated = t('lastUpdated')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb>
        <BreadcrumbItem>
        <BreadcrumbLink href="/">{t('common.home')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/privacy-policy">{t('title')}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <Link href="/privacy-policy">{t('title')}</Link>
      </Breadcrumb>

      <div className="my-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{t('lastUpdated', { date: lastUpdated })}</p>
          </div>
          <Button asChild>
            <a href={`/privacy-policy.pdf`} download>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('downloadPdf')}
            </a>
          </Button>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-xl mb-6">{t('introduction')}</p>
          
          <div className="bg-muted p-4 rounded-lg mb-8 border border-border">
            <h2 className="flex items-center text-xl font-bold mb-3">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              {t('summary.title')}
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              {[1, 2, 3, 4, 5].map((point) => (
                <li key={point}>{t(`summary.points.point${point}`)}</li>
              ))}
            </ul>
          </div>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mb-4">
            <Database className="h-5 w-5 text-primary" />
            {t('informationCollection.title')}
          </h2>
          <p>{t('informationCollection.description')}</p>
          <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">{t('informationCollection.personalData.title')}</h3>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <li key={item}>{t(`informationCollection.personalData.items.item${item}`)}</li>
            ))}
          </ul>

          <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">{t('informationCollection.nonPersonalData.title')}</h3>
          <p>{t('informationCollection.nonPersonalData.description')}</p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            {[1, 2, 3].map((item) => (
              <li key={item}>{t(`informationCollection.nonPersonalData.items.item${item}`)}</li>
            ))}
          </ul>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">
            <Eye className="h-5 w-5 text-primary" />
            {t('informationUse.title')}
          </h2>
          <p>{t('informationUse.description')}</p>
          <ul className="list-disc pl-5 space-y-2 mb-6 mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((purpose) => (
              <li key={purpose}>{t(`informationUse.purposes.purpose${purpose}`)}</li>
            ))}
          </ul>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">
            <Server className="h-5 w-5 text-primary" />
            {t('dataSharing.title')}
          </h2>
          <p>{t('dataSharing.description')}</p>
          <ul className="list-disc pl-5 space-y-2 mb-6 mt-4">
            {[1, 2, 3, 4].map((party) => (
              <li key={party}>
                <strong>{t(`dataSharing.parties.party${party}.name`)}: </strong>
                {t(`dataSharing.parties.party${party}.purpose`)}
              </li>
            ))}
          </ul>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">
            <Cookie className="h-5 w-5 text-primary" />
            {t('cookies.title')}
          </h2>
          <p>{t('cookies.description')}</p>
          <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">{t('cookies.types.title')}</h3>
          <ul className="list-disc pl-5 space-y-4 mb-6">
            {['essential', 'preference', 'analytics', 'marketing'].map((type) => (
              <li key={type}>
                <strong>{t(`cookies.types.${type}.name`)}: </strong>
                {t(`cookies.types.${type}.description`)}
              </li>
            ))}
          </ul>
          <p>{t('cookies.management')}</p>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">
            <UserCheck className="h-5 w-5 text-primary" />
            {t('userRights.title')}
          </h2>
          <p>{t('userRights.description')}</p>
          <Accordion type="single" collapsible className="w-full my-6">
            {['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection'].map((right, index) => (
              <AccordionItem key={right} value={`right-${index}`}>
                <AccordionTrigger className="text-left py-3">
                  {t(`userRights.rights.${right}.title`)}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pt-2 pb-4">{t(`userRights.rights.${right}.description`)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p>{t('userRights.exercising')}</p>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            {t('dataSecurity.title')}
          </h2>
          <p>{t('dataSecurity.description')}</p>
          <ul className="list-disc pl-5 space-y-2 mb-6 mt-4">
            {[1, 2, 3, 4].map((measure) => (
              <li key={measure}>{t(`dataSecurity.measures.measure${measure}`)}</li>
            ))}
          </ul>

          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">{t('dataRetention.title')}</h2>
          <p>{t('dataRetention.description')}</p>

          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">{t('thirdPartyLinks.title')}</h2>
          <p>{t('thirdPartyLinks.description')}</p>

          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">{t('policyUpdates.title')}</h2>
          <p>{t('policyUpdates.description')}</p>

          <h2 className="flex items-center gap-2 scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            {t('contact.title')}
          </h2>
          <p>{t('contact.description')}</p>
          <div className="bg-muted p-4 rounded-lg mt-4 border border-border">
            <p className="mb-2">
              <strong>{t('contact.company')}</strong>
              <br />
              Ariana Bandencentrale BV
              <br />
              Provinciebaan 192A
              <br />
              8880 Ledegem, België
            </p>
            <p className="mb-0">
              <strong>{t('contact.email')}:</strong> privacy@arianabandencentralebv.be
              <br />
              <strong>{t('contact.phone')}:</strong> +32 467 662 197
            </p>
          </div>

          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-4">{t('governingLaw.title')}</h2>
          <p>{t('governingLaw.description')}</p>

          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">{t('effectiveDate')}</p>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-primary/10 p-8 rounded-lg mb-12 mt-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('questions.title')}</h2>
            <p className="mb-6">{t('questions.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">{t('questions.contactUs')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:privacy@arianabandencentralebv.be">
                  privacy@arianabandencentralebv.be
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
