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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Search, Send, Trash2, Edit, Loader2 } from "lucide-react"

// API functions for newsletters
const fetchNewsletters = async () => {
  const response = await fetch('/api/newsletters');
  if (!response.ok) {
    throw new Error('Failed to fetch newsletters');
  }
  return response.json();
};

const deleteNewsletterById = async (id: string) => {
  const response = await fetch(`/api/newsletters/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete newsletter');
  }
  
  return response.json();
};

export function NewslettersList() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNewsletter, setSelectedNewsletter] = useState<null | string>(null)
  
  // Fetch newsletters with React Query
  const { 
    data: newsletters = [], 
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ['newsletters'],
    queryFn: fetchNewsletters
  })
  
  const filteredNewsletters = newsletters.filter((newsletter: { title: string }) =>
    newsletter.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Delete newsletter mutation
  const deleteNewsletterMutation = useMutation({
    mutationFn: deleteNewsletterById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
      setDeleteDialogOpen(false)
    }
  })
  
  const handleDeleteNewsletter = (id: string) => {
    setSelectedNewsletter(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedNewsletter) {
      deleteNewsletterMutation.mutate(selectedNewsletter)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500 hover:bg-green-600" variant="secondary">Sent</Badge>
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  // Handle errors and loading states
  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">Error loading newsletters: {(error as Error).message}</p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['newsletters'] })}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search newsletters..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button disabled={isLoading}>
          Filter
        </Button>
      </div>      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Schedule Date</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading newsletters...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredNewsletters.length > 0 ? (
              filteredNewsletters.map((newsletter: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; status: string; scheduledFor: string | number | Date; recipients: { toLocaleString: () => string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined }; openRate: any }) => (
                <TableRow key={newsletter.id}>
                  <TableCell className="font-medium">{newsletter.title}</TableCell>
                  <TableCell>{getStatusBadge(newsletter.status)}</TableCell>
                  <TableCell>
                    {newsletter.scheduledFor ? 
                      new Date(newsletter.scheduledFor).toLocaleDateString("en-US", {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      "—"
                    }
                  </TableCell>
                  <TableCell>{newsletter.recipients.toLocaleString()}</TableCell>
                  <TableCell>
                    {newsletter.status === 'sent' ? 
                      `${newsletter.openRate}%` : 
                      "—"
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {newsletter.status === "draft" && (
                        <Button variant="ghost" size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => newsletter.id ? handleDeleteNewsletter(String(newsletter.id)) : undefined}
                        disabled={deleteNewsletterMutation.isPending}
                      >
                        {deleteNewsletterMutation.isPending && selectedNewsletter === newsletter.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No newsletters found.
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
              This action cannot be undone. This will permanently delete the
              newsletter and remove all data associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNewsletterMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNewsletterMutation.isPending}
            >
              {deleteNewsletterMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
