"use client"

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MoreHorizontal, Trash2, User, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"

// API functions for subscribers
const fetchSubscribers = async () => {
  const response = await fetch('/api/newsletters/subscribers');
  if (!response.ok) {
    throw new Error('Failed to fetch subscribers');
  }
  return response.json();
};

const fetchSubscriberGroups = async () => {
  const response = await fetch('/api/newsletters/groups');
  if (!response.ok) {
    throw new Error('Failed to fetch subscriber groups');
  }
  return response.json();
};

const addSubscriber = async (subscriber: { email: string; name: string; groups: string[] }) => {
  const response = await fetch('/api/newsletters/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriber),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add subscriber');
  }
  
  return response.json();
};

const updateSubscriberStatus = async ({ id, subscribed }: { id: string; subscribed: boolean }) => {
  const response = await fetch(`/api/newsletters/subscribers/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscribed }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update subscriber');
  }
  
  return response.json();
};

const deleteSubscriberById = async (id: string) => {
  const response = await fetch(`/api/newsletters/subscribers/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete subscriber');
  }
  
  return response.json();
};

export function SubscribersList() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null)
  const [addSubscriberOpen, setAddSubscriberOpen] = useState(false)  
  const [newSubscriber, setNewSubscriber] = useState({
    email: "",
    name: "",
    groups: [] as string[]
  })
  
  // Fetch subscribers with React Query
  const { 
    data: subscribers = [], 
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ['subscribers'],
    queryFn: fetchSubscribers
  })
  
  // Fetch subscriber groups with React Query
  const {
    data: subscriberGroups = [],
    isLoading: isLoadingGroups
  } = useQuery({
    queryKey: ['subscriberGroups'],
    queryFn: fetchSubscriberGroups
  })
  const filteredSubscribers = subscribers.filter((subscriber: { email: string; name: string }) =>
    subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subscriber.name && subscriber.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  // Add subscriber mutation
  const addSubscriberMutation = useMutation({
    mutationFn: addSubscriber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
      setAddSubscriberOpen(false)
      setNewSubscriber({ email: "", name: "", groups: [""] })
    }
  })
  
  // Update subscriber status mutation
  const updateSubscriberMutation = useMutation({
    mutationFn: updateSubscriberStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
    }
  })
  
  // Delete subscriber mutation
  const deleteSubscriberMutation = useMutation({
    mutationFn: deleteSubscriberById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
      setDeleteDialogOpen(false)
    }
  })

  const handleDeleteSubscriber = (id: string) => {
    setSelectedSubscriberId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedSubscriberId) {
      deleteSubscriberMutation.mutate(selectedSubscriberId)
    }
  }

  const handleAddSubscriber = () => {
    addSubscriberMutation.mutate({
      email: newSubscriber.email,
      name: newSubscriber.name,
      groups: newSubscriber.groups
    })
  }
  // Handle errors and loading states
  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">Error loading subscribers: {(error as Error).message}</p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['subscribers'] })}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Dialog open={addSubscriberOpen} onOpenChange={setAddSubscriberOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>Add Subscriber</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subscriber</DialogTitle>
              <DialogDescription>
                Add a new subscriber to your newsletter list.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newSubscriber.name}
                  onChange={(e) => setNewSubscriber({...newSubscriber, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="col-span-3"
                  value={newSubscriber.email}
                  onChange={(e) => setNewSubscriber({...newSubscriber, email: e.target.value})}
                  required
                />
              </div>              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="groups" className="text-right">
                  Groups
                </Label>
                <div className="col-span-3 space-y-2">
                  {isLoadingGroups ? (
                    <div className="text-sm text-muted-foreground">Loading groups...</div>
                  ) : subscriberGroups.length > 0 ? (
                    subscriberGroups.map((group: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }) => (
                      <div className="flex items-center space-x-2" key={group.id}>
                        <input
                          type="checkbox"
                          id={`group-${group.id}`}
                          className="rounded border-gray-300"
                          checked={typeof group.id === 'string' && newSubscriber.groups.includes(group.id)}
                          onChange={(e) => {
                            if (typeof group.id === 'string') {
                              if (e.target.checked) {
                                setNewSubscriber({
                                  ...newSubscriber,
                                  groups: [...newSubscriber.groups, group.id]
                                });
                              } else {
                                setNewSubscriber({
                                  ...newSubscriber,
                                  groups: newSubscriber.groups.filter(id => id !== group.id)
                                });
                              }
                            }
                          }}
                        />
                        <label htmlFor={`group-${group.id}`} className="text-sm">
                          {group.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No groups available</div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddSubscriber}
                disabled={!newSubscriber.email}
              >
                Add Subscriber
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.map((subscriber: { id: Key | null | undefined; email: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; name: any; subscribed: any; groups: any[]; lastActive: string | number | Date }) => (
              <TableRow key={subscriber.id}>
                <TableCell>{subscriber.email}</TableCell>
                <TableCell>{subscriber.name || "—"}</TableCell>
                <TableCell>
                  {subscriber.subscribed ? 
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Subscribed</Badge> : 
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Unsubscribed</Badge>
                  }
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {subscriber.groups.map(group => {
                      const groupInfo = subscriberGroups.find((g: { id: any }) => g.id === group);
                      return (
                        <Badge key={group} variant="secondary" className="text-xs">
                          {groupInfo?.name || group}
                        </Badge>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(subscriber.lastActive).toLocaleDateString("en-US", {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex gap-2">
                        <User className="h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex gap-2">
                        <Mail className="h-4 w-4" /> Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex gap-2 text-red-600"
                        onClick={() => subscriber.id !== null && subscriber.id !== undefined && handleDeleteSubscriber(String(subscriber.id))}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredSubscribers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No subscribers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the subscriber from all newsletter lists and groups.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
