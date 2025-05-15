"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { useMutation, useQuery } from "@tanstack/react-query"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import React from "react"
import { RichTextAdapter } from "@/components/tiptap/rich-text-adapter"

// API functions for newsletters
const fetchSubscriberGroups = async () => {
  const response = await fetch('/api/newsletters/groups');
  if (!response.ok) {
    throw new Error('Failed to fetch subscriber groups');
  }
  return response.json();
};

const createNewsletter = async (newsletter: any) => {
  const response = await fetch('/api/newsletters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newsletter),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create newsletter');
  }
  
  return response.json();
};

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  subject: z.string().min(2, {
    message: "Subject must be at least 2 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  schedule: z.date().optional(),
  recipientGroups: z.array(z.string()).min(1, {
    message: "Select at least one recipient group.",
  }),
  sendNow: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

export function CreateNewsletterForm({
  onSuccess
}: {
  onSuccess: () => void
}) {
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(false)
  
  // Fetch subscriber groups
  const { data: subscriberGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['subscriberGroups'],
    queryFn: fetchSubscriberGroups,
  });
  
  // Create newsletter mutation
  const createNewsletterMutation = useMutation({
    mutationFn: createNewsletter,
    onSuccess: () => {
      toast.success("Newsletter created successfully")
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Error creating newsletter: ${error.message}`)
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subject: "",
      content: "",
      recipientGroups: [],
      sendNow: false,
    },
  })

  // Update form default values after subscriber groups are loaded
  React.useEffect(() => {
    if (subscriberGroups.length > 0) {
      form.setValue('recipientGroups', [subscriberGroups[0]?.id]);
    }
  }, [subscriberGroups, form]);

  const onSubmit = async (values: FormValues) => {
    createNewsletterMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Title</FormLabel>
              <FormControl>
                <Input placeholder="Spring 2025 Tire Sale" {...field} />
              </FormControl>
              <FormDescription>
                Internal name for your newsletter campaign.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Subject</FormLabel>
              <FormControl>
                <Input placeholder="Save 20% on all tires this spring!" {...field} />
              </FormControl>
              <FormDescription>
                The subject line that recipients will see.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />        <FormField
          control={form.control}
          name="recipientGroups"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient Groups</FormLabel>
              <div className="mt-2 border rounded-md p-4 space-y-2">
                {isLoadingGroups ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-sm animate-pulse bg-muted"></div>
                    <div className="h-4 w-40 rounded-sm animate-pulse bg-muted"></div>
                  </div>
                ) : subscriberGroups.length > 0 ? (
                  subscriberGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value?.includes(group.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...field.value, group.id])
                            : field.onChange(
                                field.value?.filter(
                                  (value) => value !== group.id
                                )
                              );
                        }}
                      />
                      <label
                        htmlFor={group.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {group.name}
                      </label>                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No recipient groups found</div>
                )}
              </div>
              <FormDescription>
                Select one or more subscriber groups to receive this newsletter.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>              <FormLabel>Email Content</FormLabel>
              <FormControl>
                <RichTextAdapter
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Create your newsletter content with rich formatting..."
                  className="min-h-[400px]"
                />
              </FormControl>
              <FormDescription>
                Create beautiful newsletter content with formatting options. 
                You can add headings, lists, images, and more.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Checkbox
            id="schedule"
            checked={isScheduleEnabled}
            onCheckedChange={(checked) => setIsScheduleEnabled(!!checked)}
          />
          <label
            htmlFor="schedule"
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Schedule for later
          </label>
        </div>        {isScheduleEnabled && (
          <FormField
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Schedule Date and Time</FormLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full sm:w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          // Preserve the current time when changing date
                          if (date && field.value) {
                            const currentDate = field.value;
                            date.setHours(currentDate.getHours());
                            date.setMinutes(currentDate.getMinutes());
                          } else if (date) {
                            // If no previous date, set default time to current time
                            const now = new Date();
                            date.setHours(now.getHours());
                            date.setMinutes(now.getMinutes());
                          }
                          field.onChange(date);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {field.value && (
                    <div className="flex gap-2">
                      <Select
                        value={field.value ? String(field.value.getHours()).padStart(2, '0') : undefined}
                        onValueChange={(hour) => {
                          const newDate = new Date(field.value || new Date());
                          newDate.setHours(parseInt(hour));
                          field.onChange(newDate);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 24}, (_, i) => i).map(hour => (
                            <SelectItem key={hour} value={String(hour).padStart(2, '0')}>
                              {String(hour).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <span className="flex items-center">:</span>
                      
                      <Select
                        value={field.value ? String(field.value.getMinutes()).padStart(2, '0') : undefined}
                        onValueChange={(minute) => {
                          const newDate = new Date(field.value || new Date());
                          newDate.setMinutes(parseInt(minute));
                          field.onChange(newDate);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map(minute => (
                            <SelectItem key={minute} value={String(minute).padStart(2, '0')}>
                              {String(minute).padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <FormDescription>
                  Choose the date and time when this newsletter should be sent.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="sendNow"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isScheduleEnabled}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Send immediately
                  </FormLabel>
                  <FormDescription>
                    Newsletter will be sent right away to all selected recipients.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit">
            {isScheduleEnabled ? "Schedule Newsletter" : "Save Newsletter"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
