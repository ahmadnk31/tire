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
              <Select
                disabled={isLoadingGroups}
                onValueChange={(value) => field.onChange([value])}
                defaultValue={field.value?.[0]}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a recipient group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {isLoadingGroups ? (
                      <SelectItem value="loading" disabled>Loading groups...</SelectItem>
                    ) : subscriberGroups.length > 0 ? (
                      subscriberGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-groups" disabled>No recipient groups found</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose which subscriber group should receive this newsletter.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your newsletter content here..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The main content of your newsletter.
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
        </div>

        {isScheduleEnabled && (
          <FormField
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Schedule Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
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
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Choose when to send this newsletter.
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
