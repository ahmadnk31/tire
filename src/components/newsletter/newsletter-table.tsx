"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Download, Send, Plus, Search, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  subscribedAt: Date;
  subscribed: boolean;
  unsubscribedAt: Date | null;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  groups?: { id: string; name: string }[];
};

export function NewsletterTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showAddSubscriberDialog, setShowAddSubscriberDialog] = useState(false);
  
  // Fetch newsletter subscribers
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await fetch("/api/newsletters/subscribers");
        if (response.ok) {
          const data = await response.json();
          setSubscribers(data);
        } else {
          console.error("Failed to fetch newsletter subscribers");
        }
      } catch (error) {
        console.error("Error fetching newsletter subscribers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscribers();
  }, []);

  // Filter subscribers based on search query
  const filteredSubscribers = subscribers.filter(
    (subscriber) =>
      subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subscriber.name && subscriber.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handler for adding new subscriber
  const handleAddSubscriber = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    try {
      const response = await fetch("/api/newsletters/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name, source: "admin" }),
      });

      if (response.ok) {
        // Add the new subscriber to the list
        const newSubscriber = await response.json();
        setSubscribers([...subscribers, newSubscriber]);
        setShowAddSubscriberDialog(false);
        // Reset the form
        event.currentTarget.reset();
      } else {
        console.error("Failed to add subscriber");
      }
    } catch (error) {
      console.error("Error adding subscriber:", error);
    }
  };

  // Handler for toggling subscriber status (active/inactive)
  const toggleSubscriberStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/newsletters/subscribers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscribed: !currentStatus }),
      });

      if (response.ok) {
        // Update the subscriber in the list
        setSubscribers(
          subscribers.map((subscriber) =>
            subscriber.id === id
              ? { ...subscriber, subscribed: !currentStatus, unsubscribedAt: !currentStatus ? new Date() : null }
              : subscriber
          )
        );
      } else {
        console.error("Failed to update subscriber");
      }
    } catch (error) {
      console.error("Error updating subscriber:", error);
    }
  };

  // Handler for deleting a subscriber
  const deleteSubscriber = async (id: string) => {
    try {
      const response = await fetch(`/api/newsletters/subscribers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the subscriber from the list
        setSubscribers(subscribers.filter((subscriber) => subscriber.id !== id));
      } else {
        console.error("Failed to delete subscriber");
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
    }
  };

  // Handler for exporting subscribers to CSV
  const exportToCsv = () => {
    const headers = ["Email", "Name", "Source", "Subscribed At", "Status", "Unsubscribed At"];
    
    const csvData = filteredSubscribers.map((subscriber) => [
      subscriber.email,
      subscriber.name || "",
      subscriber.source || "website",
      formatDate(subscriber.subscribedAt),
      subscriber.subscribed ? "Active" : "Inactive",
      subscriber.unsubscribedAt ? formatDate(subscriber.unsubscribedAt) : ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `newsletter_subscribers_${formatDate(new Date())}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search subscribers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[300px] pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddSubscriberDialog} onOpenChange={setShowAddSubscriberDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscriber
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subscriber</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubscriber} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name (Optional)</label>
                  <Input id="name" name="name" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddSubscriberDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Subscriber</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => router.push("/dashboard/newsletters/campaigns")}>
            <Send className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Unsubscribed On</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>{subscriber.email}</TableCell>
                  <TableCell>{subscriber.name || "—"}</TableCell>
                  <TableCell>{subscriber.source || "website"}</TableCell>
                  <TableCell>{formatDate(subscriber.subscribedAt)}</TableCell>                  <TableCell>
                    <Badge variant={subscriber.subscribed ? "default" : "outline"}>
                      {subscriber.subscribed ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subscriber.unsubscribedAt ? formatDate(subscriber.unsubscribedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">                        <DropdownMenuItem
                          onClick={() => toggleSubscriberStatus(subscriber.id, subscriber.subscribed)}
                        >
                          {subscriber.subscribed ? "Unsubscribe" : "Reactivate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteSubscriber(subscriber.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: {filteredSubscribers.length} subscribers
        </div>
      </div>
    </div>
  );
}
