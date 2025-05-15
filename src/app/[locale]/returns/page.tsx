'use client'

import { useTranslations } from 'next-intl'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { 
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react'

export default function ReturnsPage() {
  const t = useTranslations('Returns')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb>
        <Link href="/">{t('common.home')}</Link>
        <Link href="/returns">{t('title')}</Link>
      </Breadcrumb>

      <div className="my-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        {/* Return Policy Overview */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">{t('overview.title')}</h2>
              <p className="mb-4">{t('overview.description1')}</p>
              <p>{t('overview.description2')}</p>
              
              <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">{t('overview.satisfaction.title')}</h3>
                </div>
                <p className="text-muted-foreground ml-8">{t('overview.satisfaction.description')}</p>
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{t('eligibility.title')}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{t('eligibility.eligible.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('eligibility.eligible.description')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{t('eligibility.ineligible.title')}</h4>
                      <p className="text-sm text-muted-foreground">{t('eligibility.ineligible.description')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Return Process Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('process.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((step) => (
              <Card key={step}>
                <CardContent className="pt-6">
                  <div className="mb-4 bg-primary/10 p-4 rounded-full w-12 h-12 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(`process.steps.step${step}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`process.steps.step${step}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">
                {t('process.startReturnButton')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('refunds.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('refunds.timelines.title')}</h3>
              <p className="mb-4">{t('refunds.timelines.description')}</p>
              
              <ul className="space-y-3">
                {[1, 2, 3].map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span>{t(`refunds.timelines.point${point}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">{t('refunds.methods.title')}</h3>
              <p className="mb-4">{t('refunds.methods.description')}</p>
              
              <div className="space-y-4">
                {['original', 'credit', 'exchange'].map((method) => (
                  <div key={method} className="border-b border-border pb-3">
                    <h4 className="font-medium mb-1">{t(`refunds.methods.${method}.title`)}</h4>
                    <p className="text-sm text-muted-foreground">{t(`refunds.methods.${method}.description`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Common Return Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('faq.title')}</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {[1, 2, 3, 4, 5].map((questionNum) => (
              <AccordionItem key={questionNum} value={`item-${questionNum}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                    {t(`faq.questions.q${questionNum}.question`)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pt-2 pb-4 pl-8">{t(`faq.questions.q${questionNum}.answer`)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Important Notes */}
        <div className="mb-12 bg-muted p-6 rounded-lg border border-border">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('notes.title')}</h3>
              <ul className="space-y-2">
                {[1, 2, 3].map((note) => (
                  <li key={note} className="flex items-start gap-2">
                    <span className="text-sm bg-primary/20 text-primary px-2 py-0.5 rounded font-medium mt-0.5">
                      {t('notes.noteLabel')}
                    </span>
                    <span>{t(`notes.note${note}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact for Return Questions */}
        <div className="bg-primary/10 p-8 rounded-lg mb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
            <p className="mb-6">{t('contact.description')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col h-full">
                <h3 className="font-medium mb-2">{t('contact.email.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('contact.email.description')}</p>
                <Button variant="outline" className="mt-auto" asChild>
                  <a href="mailto:returns@arianabandencentralebv.be">returns@arianabandencentralebv.be</a>
                </Button>
              </div>
              <div className="flex flex-col h-full">
                <h3 className="font-medium mb-2">{t('contact.phone.title')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('contact.phone.description')}</p>
                <Button variant="outline" className="mt-auto" asChild>
                  <a href="tel:+32467662197">+32 467 662 197</a>
                </Button>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button asChild>
                <Link href="/contact" className="inline-flex items-center gap-2">
                  {t('contact.contactForm')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
