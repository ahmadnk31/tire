import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const t= await getTranslations("Account.layout");
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/account/settings");
  }
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        <Separator />
          <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="settings" asChild>
              <Link href="/account/settings">{t('tabs.settings')}</Link>
            </TabsTrigger>
            <TabsTrigger value="orders" asChild>
              <Link href="/account/orders">{t('tabs.orders')}</Link>
            </TabsTrigger>
            <TabsTrigger value="favorites" asChild>
              <Link href="/account/favorites">{t('tabs.favorites')}</Link>
            </TabsTrigger>
            <TabsTrigger value="testimonials" asChild>
              <Link href="/account/testimonials">{t('tabs.testimonials')}</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div>{children}</div>
      </div>
    </div>
  );
}