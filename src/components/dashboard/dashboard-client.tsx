"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Box, Layers, Tag, PackageOpen, Users, ShoppingCart, MapPin, Settings, Bell, User, Car, Calendar, Truck, MailboxIcon, Percent, BadgePercent } from "lucide-react";
import { IconBoxModel } from "@tabler/icons-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DashboardIcon } from "@radix-ui/react-icons";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export default function DashboardClient({
  children,
  user
}: {
  children: React.ReactNode;
  user: any;
}) {
  const isMobile = useIsMobile();
 
  return (
   
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-screen flex-col w-full">
          <header className="border-b bg-background z-40 flex h-14 items-center px-4 lg:px-6">          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9" />
            <Link href="/" className="flex items-center gap-2">
              <span className="font-semibold">Tire Dashboard</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/dashboard/notifications" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Link>
            <Link href="/dashboard/profile" className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar>
            <SidebarHeader className="border-b p-4">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </SidebarHeader>
            <SidebarContent className="overflow-y-auto pt-16 pb-2 px-4 lg:px-6">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <DashboardIcon className="mr-2" />
                      Dashboard
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/brands">
                      <Tag className="mr-2" />
                      Brands
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/models">
                      <IconBoxModel className="mr-2" />
                      Models
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/categories">
                      <Layers className="mr-2" />
                      Categories
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/products">
                      <Box className="mr-2" />
                      Products
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Vehicle Management Section */}
                <SidebarMenuItem className="mt-6">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Vehicle Management
                    </h3>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/vehicles">
                      <Car className="mr-2" />
                      Vehicles
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Inventory Management Section */}
                <SidebarMenuItem className="mt-6">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Inventory Management
                    </h3>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/inventory">
                      <PackageOpen className="mr-2" />
                      Inventory
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/orders">
                      <ShoppingCart className="mr-2" />
                      Orders
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/locations">
                      <MapPin className="mr-2" />
                      Locations
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Appointments Section */}
                <SidebarMenuItem className="mt-6">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Appointments
                    </h3>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/appointments">
                      <Calendar className="mr-2" />
                      Manage Appointments
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Admin Section */}
                <SidebarMenuItem className="mt-6">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Administration
                    </h3>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/retailer-applications">
                      <Users className="mr-2" />
                      Retailer Applications
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/newsletters">
                      <MailboxIcon className="mr-2" />
                      Newsletters
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Marketing Section */}
                <SidebarMenuItem className="mt-6">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Marketing
                    </h3>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/promotions">
                      <BadgePercent className="mr-2" />
                      Deals & Promotions
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Settings Section */}
                <SidebarMenuItem className="mt-6">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Settings
                    </h3>
                  </div>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/settings/profile">
                      <User className="mr-2" />
                      Profile Settings
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/settings/notifications">
                      <Bell className="mr-2" />
                      Notification Settings
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/settings/business-hours">
                      <Calendar className="mr-2" />
                      Business Hours
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/settings/general">
                      <Settings className="mr-2" />
                      General Settings
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard/settings/shipping">
                      <Truck className="mr-2" />
                      Shipping Settings
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}