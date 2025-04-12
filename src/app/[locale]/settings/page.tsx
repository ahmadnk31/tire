import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProfileForm from "@/components/settings/profile-form";
import PasswordForm from "@/components/settings/password-form";
import NotificationsForm from "@/components/settings/notifications-form";
import RetailerForm from "@/components/settings/retailer-form";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth/auth-options";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }
  
  // Fetch user with retailer profile if it exists
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { retailerProfile: true }
  });
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Separator />
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            {user.role === "RETAILER" && (
              <TabsTrigger value="retailer">Retailer Profile</TabsTrigger>
            )}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} retailerProfile={user.retailerProfile} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Update your password and security settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordForm userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {user.role === "RETAILER" && (
            <TabsContent value="retailer" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Retailer Information</CardTitle>
                  <CardDescription>
                    Manage your retailer business details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RetailerForm retailerProfile={user.retailerProfile} userId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationsForm userId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}