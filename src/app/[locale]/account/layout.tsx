import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/account/settings");
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>
        <Separator />
          <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="settings" asChild>
              <Link href="/account/settings">Settings</Link>
            </TabsTrigger>
            <TabsTrigger value="orders" asChild>
              <Link href="/account/orders">Orders</Link>
            </TabsTrigger>
            <TabsTrigger value="favorites" asChild>
              <Link href="/account/favorites">Favorites</Link>
            </TabsTrigger>
            <TabsTrigger value="testimonials" asChild>
              <Link href="/account/testimonials">Testimonials</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div>{children}</div>
      </div>
    </div>
  );
}