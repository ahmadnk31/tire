import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how and when you receive notifications.
        </p>
      </div>
      <Separator />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Select which types of email notifications you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="order-updates">Order Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications about your order status changes.
                </p>
              </div>
              <Switch id="order-updates" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inventory-alerts">Inventory Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when inventory levels are low.
                </p>
              </div>
              <Switch id="inventory-alerts" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">
                  Stay updated with promotions and newsletters.
                </p>
              </div>
              <Switch id="marketing-emails" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Application Notifications</CardTitle>
            <CardDescription>
              Configure your in-app notification preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Browser Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Allow desktop notifications in your browser.
                </p>
              </div>
              <Switch id="browser-notifications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-alerts">Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Play sounds for important notifications.
                </p>
              </div>
              <Switch id="sound-alerts" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}