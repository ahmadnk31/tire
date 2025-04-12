"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DAYS_OF_WEEK = [
  { name: "Sunday", value: 0 },
  { name: "Monday", value: 1 },
  { name: "Tuesday", value: 2 },
  { name: "Wednesday", value: 3 },
  { name: "Thursday", value: 4 },
  { name: "Friday", value: 5 },
  { name: "Saturday", value: 6 },
];

interface BusinessHour {
  id?: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function BusinessHoursPage() {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with default business hours (Monday-Saturday, 9am-5pm)
  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/business-hours');
      if (!response.ok) {
        throw new Error('Failed to fetch business hours');
      }
      const data = await response.json();
      setBusinessHours(data.businessHours);
    } catch (error) {
      console.error('Error fetching business hours:', error);
      toast.error('Failed to load business hours');
      
      // If we couldn't fetch, initialize with defaults
      const defaultHours = DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.value,
        isOpen: day.value !== 0, // Closed on Sundays by default
        openTime: '09:00',
        closeTime: '17:00',
      }));
      setBusinessHours(defaultHours);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setBusinessHours(prevHours =>
      prevHours.map(hour =>
        hour.dayOfWeek === dayOfWeek ? { ...hour, isOpen: !hour.isOpen } : hour
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setBusinessHours(prevHours =>
      prevHours.map(hour =>
        hour.dayOfWeek === dayOfWeek ? { ...hour, [field]: value } : hour
      )
    );
  };

  const saveBusinessHours = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/business-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessHours }),
      });

      if (!response.ok) {
        throw new Error('Failed to save business hours');
      }

      toast.success('Business hours updated successfully');
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error('Failed to update business hours');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Business Hours</h3>
        <p className="text-sm text-muted-foreground">
          Configure your business operating hours for appointment scheduling.
        </p>
      </div>
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
            <CardDescription>
              Set the days and times when customers can schedule appointments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businessHours.map((day) => (
                <div key={day.dayOfWeek} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`day-${day.dayOfWeek}`}
                      checked={day.isOpen}
                      onCheckedChange={() => handleToggleDay(day.dayOfWeek)}
                    />
                    <Label htmlFor={`day-${day.dayOfWeek}`} className="font-medium">
                      {DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.name}
                    </Label>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor={`open-${day.dayOfWeek}`} className="text-xs">
                      Opening Time
                    </Label>
                    <Input
                      id={`open-${day.dayOfWeek}`}
                      type="time"
                      value={day.openTime}
                      onChange={(e) => handleTimeChange(day.dayOfWeek, 'openTime', e.target.value)}
                      disabled={!day.isOpen}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor={`close-${day.dayOfWeek}`} className="text-xs">
                      Closing Time
                    </Label>
                    <Input
                      id={`close-${day.dayOfWeek}`}
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => handleTimeChange(day.dayOfWeek, 'closeTime', e.target.value)}
                      disabled={!day.isOpen}
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end mt-6">
                <Button onClick={saveBusinessHours} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}