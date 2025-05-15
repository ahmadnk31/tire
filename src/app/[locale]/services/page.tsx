'use client'

import { useTranslations } from 'next-intl'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator, BreadcrumbLink } from '@/components/ui/breadcrumb'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'

export default function ServicesPage() {
  const t = useTranslations('Services')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">{t('common.home')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/services">{t('title')}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="my-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('overview.title')}</h2>
            <p className="mb-4">{t('overview.paragraph1')}</p>
            <p>{t('overview.paragraph2')}</p>
          </div>
          <div className="relative h-[300px] rounded-lg overflow-hidden">
            <Image 
              src="/images/services/service-overview.jpg" 
              alt={t('overview.imageAlt')}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <Tabs defaultValue="tires" className="mb-12">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="tires">{t('categories.tires')}</TabsTrigger>
            <TabsTrigger value="maintenance">{t('categories.maintenance')}</TabsTrigger>
            <TabsTrigger value="repair">{t('categories.repair')}</TabsTrigger>
            <TabsTrigger value="consultation">{t('categories.consultation')}</TabsTrigger>
          </TabsList>
          
          {['tires', 'maintenance', 'repair', 'consultation'].map((category) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-semibold mb-4">{t(`services.${category}.title`)}</h3>
                      <p className="mb-4">{t(`services.${category}.description`)}</p>
                      
                      <ul className="space-y-2 mb-6">
                        {[1, 2, 3, 4].map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{t(`services.${category}.items.item${item}`)}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex flex-wrap gap-4">
                        <Button asChild>
                          <Link href="/appointment">{t('appointment.schedule')}</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/contact">{t('appointment.inquire')}</Link>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative h-[250px] md:h-full rounded-lg overflow-hidden">
                      <Image 
                        src={`/images/services/${category}.jpg`}
                        alt={t(`services.${category}.imageAlt`)}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('guarantees.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((guarantee) => (
              <Card key={guarantee}>
                <CardContent className="pt-6">
                  <div className="mb-4 bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(`guarantees.items.item${guarantee}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`guarantees.items.item${guarantee}.description`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="bg-muted p-8 rounded-lg mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('cta.title')}</h2>
            <p className="mb-6">{t('cta.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/appointment">{t('cta.scheduleService')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">{t('cta.contact')}</Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('testimonials.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((testimonial) => (
              <Card key={testimonial}>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="mr-4">
                      <div className="bg-muted w-12 h-12 rounded-full overflow-hidden relative">
                        <Image 
                          src={`/images/testimonials/avatar-${testimonial}.jpg`}
                          alt={t(`testimonials.items.item${testimonial}.name`)}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{t(`testimonials.items.item${testimonial}.name`)}</h3>
                      <p className="text-sm text-muted-foreground">{t(`testimonials.items.item${testimonial}.location`)}</p>
                    </div>
                  </div>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="italic">{t(`testimonials.items.item${testimonial}.quote`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
