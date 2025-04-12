import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your application preferences and display settings.
        </p>
      </div>
      <Separator />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>
              Customize how the dashboard appears.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="system">
                <SelectTrigger id="theme" className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Themes</SelectLabel>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred color theme for the application.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger id="language" className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Languages</SelectLabel>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Set the language for the user interface.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Preferences</CardTitle>
            <CardDescription>
              Set your default dashboard views and behaviors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default Dashboard View</Label>
              <RadioGroup defaultValue="summary">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="summary" id="summary" />
                  <Label htmlFor="summary">Summary View</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <Label htmlFor="detailed">Detailed View</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="compact" />
                  <Label htmlFor="compact">Compact View</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Select the default view when accessing the dashboard.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">Save Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}