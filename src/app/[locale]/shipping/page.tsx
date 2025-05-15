'use client'

import { useTranslations } from 'next-intl'
import { Breadcrumb,BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb'
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
import { Truck, Clock, MapPin, AlertTriangle, Check } from 'lucide-react'

export default function ShippingPage() {
  const t = useTranslations('Shipping')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb>
        <BreadcrumbLink href="/">{t('common.home')}</BreadcrumbLink>
        <BreadcrumbItem>
        <BreadcrumbLink href="/shipping">{t('title')}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="my-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        {/* Shipping Methods */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('methods.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['standard', 'express', 'store', 'bulkOrder'].map((method) => (
              <Card key={method}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                      {method === 'standard' && <Truck className="h-5 w-5 text-primary" />}
                      {method === 'express' && <Clock className="h-5 w-5 text-primary" />}
                      {method === 'store' && <MapPin className="h-5 w-5 text-primary" />}
                      {method === 'bulkOrder' && <Truck className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{t(`methods.${method}.title`)}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{t(`methods.${method}.time`)}</p>
                      <p className="mb-2">{t(`methods.${method}.description`)}</p>
                      <p className="font-medium">{t('methods.cost')}: {t(`methods.${method}.cost`)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shipping Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('policies.title')}</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {['eligibility', 'tracking', 'damages', 'internationally', 'restrictions'].map((policy, index) => (
              <AccordionItem key={policy} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {t(`policies.${policy}.question`)}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pt-2 pb-4">{t(`policies.${policy}.answer`)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Shipping Timeline */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('timeline.title')}</h2>
          
          <div className="relative border-l-2 border-muted pl-8 pb-8 space-y-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="relative">
                <div className="absolute -left-10 mt-1.5 h-4 w-4 rounded-full bg-primary"></div>
                <h3 className="text-lg font-semibold mb-1">{t(`timeline.steps.step${step}.title`)}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t(`timeline.steps.step${step}.time`)}</p>
                <p>{t(`timeline.steps.step${step}.description`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Zones */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('zones.title')}</h2>
          <p className="mb-6">{t('zones.description')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((zone) => (
              <Card key={zone}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-3">{t(`zones.zone${zone}.name`)}</h3>
                  <p className="mb-2">{t(`zones.zone${zone}.areas`)}</p>
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex justify-between">
                      <span>{t('zones.standardShipping')}:</span>
                      <span className="font-medium">{t(`zones.zone${zone}.standardTime`)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('zones.expressShipping')}:</span>
                      <span className="font-medium">{t(`zones.zone${zone}.expressTime`)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t(`notes.note${note}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact for Shipping Questions */}
        <div className="bg-primary/10 p-8 rounded-lg mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('contact.title')}</h2>
            <p className="mb-6">{t('contact.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">{t('contact.button')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
