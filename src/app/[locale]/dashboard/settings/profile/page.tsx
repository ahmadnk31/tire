import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ProfileForm from "@/components/settings/profile-form"
import PasswordForm from "@/components/settings/password-form"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/auth/auth-options"

export default async function ProfileSettingsPage() {
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and account preferences.
        </p>
      </div>
      <Separator />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} retailerProfile={user.retailerProfile} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your password and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}