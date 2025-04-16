"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { InstallationForm } from "./InstallationForm";
import { AdditionalServicesList } from "./AdditionalServicesList";
import { IconStar } from "@tabler/icons-react";
import { ClockIcon, SettingsIcon, ShieldIcon, WrenchIcon } from "lucide-react";


export default function InstallationPage() {
  const t = useTranslations("Homepage.services.installationPage");

  return (
    <div className="container mx-auto py-8 space-y-16">      {/* Hero Section */}
      <section className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 md:p-12 flex flex-col md:flex-row items-center justify-between">
        <div className="space-y-4 md:w-1/2 w-full text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">{t("hero.title")}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">{t("hero.subtitle")}</p>
          <div className="flex justify-center md:justify-start">
            <Button size="lg" className="px-8 py-6 text-lg">{t("hero.cta")}</Button>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-48 sm:h-64 md:h-80 lg:h-96 relative mt-8 md:mt-0">
          <Image 
            src="/images/tire-installation.png"
            alt={t("hero.title")}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t("benefits.title")}</h2>
          <div className="h-1 w-24 bg-primary mx-auto my-4"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <IconStar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("benefits.quality.title")}</h3>
              <p className="text-muted-foreground">{t("benefits.quality.description")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("benefits.equipment.title")}</h3>
              <p className="text-muted-foreground">{t("benefits.equipment.description")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("benefits.warranty.title")}</h3>
              <p className="text-muted-foreground">{t("benefits.warranty.description")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("benefits.convenience.title")}</h3>
              <p className="text-muted-foreground">{t("benefits.convenience.description")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Process Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t("process.title")}</h2>
          <div className="h-1 w-24 bg-primary mx-auto my-4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">1</div>
            <h3 className="text-xl font-bold">{t("process.steps.inspection.title")}</h3>
            <p className="text-muted-foreground">{t("process.steps.inspection.description")}</p>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">2</div>
            <h3 className="text-xl font-bold">{t("process.steps.removal.title")}</h3>
            <p className="text-muted-foreground">{t("process.steps.removal.description")}</p>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">3</div>
            <h3 className="text-xl font-bold">{t("process.steps.mounting.title")}</h3>
            <p className="text-muted-foreground">{t("process.steps.mounting.description")}</p>
          </div>
          
          {/* Step 4 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">4</div>
            <h3 className="text-xl font-bold">{t("process.steps.balancing.title")}</h3>
            <p className="text-muted-foreground">{t("process.steps.balancing.description")}</p>
          </div>
          
          {/* Step 5 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">5</div>
            <h3 className="text-xl font-bold">{t("process.steps.installation.title")}</h3>
            <p className="text-muted-foreground">{t("process.steps.installation.description")}</p>
          </div>
          
          {/* Step 6 */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">6</div>
            <h3 className="text-xl font-bold">{t("process.steps.inspection2.title")}</h3>
            <p className="text-muted-foreground">{t("process.steps.inspection2.description")}</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t("pricing.title")}</h2>
          <p className="text-muted-foreground mt-2">{t("pricing.subtitle")}</p>
          <div className="h-1 w-24 bg-primary mx-auto my-4"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Standard Package */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">{t("pricing.standard.title")}</h3>
                <div className="mt-2 text-2xl font-bold text-primary">{t("pricing.standard.price")}</div>
                <div className="text-sm text-muted-foreground">{t("pricing.standard.includes")}</div>
              </div>
              <Button className="w-full">{t("hero.cta")}</Button>
            </CardContent>
          </Card>

          {/* Premium Package */}
          <Card className="border-2 border-primary">
            <CardContent className="pt-6">
              <Badge className="absolute top-0 right-4 translate-y-[-50%]">Popular</Badge>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">{t("pricing.premium.title")}</h3>
                <div className="mt-2 text-2xl font-bold text-primary">{t("pricing.premium.price")}</div>
                <div className="text-sm text-muted-foreground">{t("pricing.premium.includes")}</div>
              </div>
              <Button className="w-full">{t("hero.cta")}</Button>
            </CardContent>
          </Card>

          {/* Specialty Package */}
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">{t("pricing.specialty.title")}</h3>
                <div className="mt-2 text-2xl font-bold text-primary">{t("pricing.specialty.price")}</div>
                <div className="text-sm text-muted-foreground">{t("pricing.specialty.includes")}</div>
              </div>
              <Button className="w-full">{t("hero.cta")}</Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">{t("pricing.note")}</p>
      </section>

      {/* FAQ Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t("faq.title")}</h2>
          <div className="h-1 w-24 bg-primary mx-auto my-4"></div>
        </div>

        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger>{t("faq.questions.time.question")}</AccordionTrigger>
            <AccordionContent>{t("faq.questions.time.answer")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>{t("faq.questions.appointment.question")}</AccordionTrigger>
            <AccordionContent>{t("faq.questions.appointment.answer")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>{t("faq.questions.bring.question")}</AccordionTrigger>
            <AccordionContent>{t("faq.questions.bring.answer")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>{t("faq.questions.wait.question")}</AccordionTrigger>
            <AccordionContent>{t("faq.questions.wait.answer")}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>{t("faq.questions.warranty.question")}</AccordionTrigger>
            <AccordionContent>{t("faq.questions.warranty.answer")}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t("additionalServices.title")}</h2>
          <p className="text-muted-foreground mt-2">{t("additionalServices.subtitle")}</p>
          <div className="h-1 w-24 bg-primary mx-auto my-4"></div>
        </div>
        
        <AdditionalServicesList />
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground rounded-xl p-6 sm:p-8 md:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">{t("cta.title")}</h2>
        <p className="text-base sm:text-lg mt-2 max-w-2xl mx-auto">{t("cta.subtitle")}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-6">{t("cta.button")}</Button>
          <div className="flex items-center justify-center">
            <span className="mx-2 text-sm sm:text-base">{t("cta.or")}</span>
            <Button variant="link" className="text-white hover:text-white/80">{t("cta.contact")}</Button>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      {/* Booking Form */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t("form.title")}</h2>
          <div className="h-1 w-24 bg-primary mx-auto my-4"></div>
        </div>

        <InstallationForm />
      </section>
    </div>
  );
}
