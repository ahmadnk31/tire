"use client";

import { useState } from "react";
import { AppointmentCalendar } from "./components/appointment-calendar";
import AppointmentReminders from "./components/appointment-reminders";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, List } from "lucide-react";
import {AppointmentsPageContent} from "./appointments-content";

export default function AppointmentsWithCalendarPage() {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs value={view} onValueChange={(value) => setView(value as "list" | "calendar")}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="space-y-6">
          <AppointmentsPageContent />
          <AppointmentReminders />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-6">
          <AppointmentCalendar />
          <AppointmentReminders />
        </TabsContent>
      </Tabs>
    </div>
  );
}