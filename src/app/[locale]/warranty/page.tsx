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
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  HelpCircle 
} from 'lucide-react'

export default function WarrantyPage() {
  const t = useTranslations('Warranty')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: t('common.home'), href: '/' },
          { label: t('title'), href: '/warranty' },
        ]}
      />

      <div className="my-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        {/* Warranty Overview */}
        <div className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-4">{t('overview.title')}</h2>
              <p className="mb-4">{t('overview.description1')}</p>
              <p className="mb-4">{t('overview.description2')}</p>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">{t('overview.commitment')}</h3>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t('quickAccess.title')}
                </h3>
                
                <ul className="space-y-3">
                  {['register', 'claim', 'check', 'contact'].map((item) => (
                    <li key={item}>
                      <Button variant="outline" className="w-full justify-start" asChild>
                        <Link href={`#${item}`}>
                          {t(`quickAccess.${item}`)}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Warranty Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('types.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['manufacturer', 'roadHazard', 'extended'].map((type) => (
              <Card key={type}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-2">{t(`types.${type}.name`)}</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">{t(`types.${type}.duration`)}</p>
                  <p className="text-center mb-6">{t(`types.${type}.description`)}</p>
                  <ul className="space-y-2 mb-6">
                    {[1, 2, 3].map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{t(`types.${type}.coverage.point${point}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coverage Details */}
        <div id="coverage" className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('coverage.title')}</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {['covered', 'notCovered', 'conditions', 'prorating'].map((section, index) => (
              <AccordionItem key={section} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    {section === 'covered' && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {section === 'notCovered' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {section === 'conditions' && (
                      <FileText className="h-5 w-5 text-amber-500" />
                    )}
                    {section === 'prorating' && (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                    {t(`coverage.${section}.title`)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-4 pl-8">
                    <p className="mb-4">{t(`coverage.${section}.description`)}</p>
                    {section === 'prorating' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border border-border px-4 py-2">{t('coverage.prorating.table.treadWear')}</th>
                              <th className="border border-border px-4 py-2">{t('coverage.prorating.table.creditPercentage')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 4].map((row) => (
                              <tr key={row}>
                                <td className="border border-border px-4 py-2">{t(`coverage.prorating.table.row${row}.wear`)}</td>
                                <td className="border border-border px-4 py-2">{t(`coverage.prorating.table.row${row}.credit`)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {[1, 2, 3, 4].map((point) => (
                          <li key={point} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>{t(`coverage.${section}.points.point${point}`)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Warranty Claim Process */}
        <div id="claim" className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('claims.title')}</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <ol className="relative border-l border-primary space-y-6 pl-8">
                {[1, 2, 3, 4].map((step) => (
                  <li key={step} className="relative">
                    <div className="absolute -left-3 mt-1.5 flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                      <span className="text-white text-xs font-bold">{step}</span>
                    </div>
                    <h3 className="text-lg font-medium mb-1">{t(`claims.steps.step${step}.title`)}</h3>
                    <p className="text-muted-foreground mb-2">{t(`claims.steps.step${step}.description`)}</p>
                    {step === 1 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button asChild size="sm">
                          <Link href="/contact">{t('claims.contactButton')}</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${t('claims.phoneNumber')}`}>{t('claims.callButton')}</a>
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">{t('claims.requirements.title')}</h3>
                  <p className="mb-4">{t('claims.requirements.description')}</p>
                  
                  <ul className="space-y-3">
                    {[1, 2, 3, 4].map((req) => (
                      <li key={req} className="flex items-start gap-3">
                        <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span>{t(`claims.requirements.list.item${req}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12" id="faq">
          <h2 className="text-2xl font-semibold mb-6">{t('faq.title')}</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {[1, 2, 3, 4, 5].map((qIndex) => (
              <AccordionItem key={qIndex} value={`faq-${qIndex}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    {t(`faq.questions.q${qIndex}.question`)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pt-2 pb-4 pl-8">{t(`faq.questions.q${qIndex}.answer`)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact for Warranty Questions */}
        <div id="contact" className="bg-primary/10 p-8 rounded-lg mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
            <p className="mb-6">{t('contact.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">{t('contact.button')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={`tel:${t('contact.phoneNumber')}`}>{t('contact.callUs')}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
