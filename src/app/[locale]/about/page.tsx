'use client'

import { useTranslations } from 'next-intl'
import { Breadcrumb } from '@/components/breadcrumb'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import Image from 'next/image'

export default function AboutPage() {
  const t = useTranslations('About')

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: t('common.home'), href: '/' },
          { label: t('title'), href: '/about' },
        ]}
      />

      <div className="my-8">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('ourStory.title')}</h2>
            <p className="mb-4">{t('ourStory.paragraph1')}</p>
            <p>{t('ourStory.paragraph2')}</p>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            <Image 
              src="/images/about/tire-shop.jpg" 
              alt={t('ourStory.imageAlt')}
              fill
              className="object-cover"
            />
          </div>
        </div>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">{t('mission.title')}</h2>
            <p className="mb-4">{t('mission.statement')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">{t('values.quality.title')}</h3>
                <p className="text-muted-foreground">{t('values.quality.description')}</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">{t('values.service.title')}</h3>
                <p className="text-muted-foreground">{t('values.service.description')}</p>
              </div>
              <div className="text-center">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">{t('values.innovation.title')}</h3>
                <p className="text-muted-foreground">{t('values.innovation.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('team.title')}</h2>
          <p className="mb-8">{t('team.description')}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((member) => (
              <div key={member} className="bg-card rounded-lg overflow-hidden shadow-md">
                <div className="relative h-64">
                  <Image 
                    src={`/images/about/team-member-${member}.jpg`}
                    alt={t(`team.members.member${member}.name`)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-1">{t(`team.members.member${member}.name`)}</h3>
                  <p className="text-primary mb-3">{t(`team.members.member${member}.position`)}</p>
                  <p className="text-muted-foreground">{t(`team.members.member${member}.bio`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12 bg-muted p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{t('expertise.title')}</h2>
          <p className="mb-6">{t('expertise.description')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-start gap-4">
                <div className="mt-1 bg-background rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{t(`expertise.points.point${item}.title`)}</h3>
                  <p className="text-muted-foreground">{t(`expertise.points.point${item}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('conclusion.title')}</h2>
          <p className="max-w-3xl mx-auto">{t('conclusion.message')}</p>
        </div>
      </div>
    </div>
  )
}
