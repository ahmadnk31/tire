"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  sentCount: number;
  openCount: number;
  clickCount: number;
  promotion: {
    id: string;
    title: string;
  };
}

// Fetch campaigns function
const fetchCampaigns = async (status?: string) => {
  const query = status ? `?status=${status}` : "";
  const response = await fetch(`/api/campaigns${query}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch campaigns");
  }
  
  const data = await response.json();
  return data.campaigns;
};

// Delete campaign function
const deleteCampaign = async (id: string) => {
  const response = await fetch(`/api/campaigns/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete campaign");
  }

  return id;
};

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = params.locale as string;

  // Query for fetching campaigns with the status filter
  const { 
    data: campaigns = [], 
    isLoading: loading, 
    error: queryError 
  } = useQuery<Campaign[], Error>({
    queryKey: ['campaigns', statusFilter],
    queryFn: () => fetchCampaigns(statusFilter || undefined),
  });

  const error = queryError?.message || null;
  // Mutation for deleting campaigns
  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: (deletedId) => {
      // Invalidate and refetch the campaigns query when a campaign is deleted
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: Error) => {
      // Handle error for the UI
      console.error("Delete error:", err);
    }
  });

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-200 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${locale}/dashboard`}>Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink>Email Campaigns</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email campaigns for your promotions and appointments
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/campaigns/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      <Separator className="my-6" />

      {error && (
        <div className="bg-destructive/15 border border-destructive/30 text-destructive rounded p-4 my-4">
          Error: {error}
        </div>
      )}

      {/* Filter controls */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="status-filter">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>      {loading ? (
        <div className="w-full flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="bg-card shadow rounded-lg overflow-hidden border">
          <table className="w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Campaign Name
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Promotion
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Scheduled/Sent
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>            <tbody className="bg-background divide-y divide-border">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">
                      {campaign.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                        campaign.status
                      )}`}
                    >
                      {campaign.status.charAt(0).toUpperCase() +
                        campaign.status.slice(1)}
                    </span>
                  </td>                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/promotions/${campaign.promotion.id}`}
                      className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                    >
                      {campaign.promotion.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {campaign.status === "scheduled" ? (
                      <span title="Scheduled For">
                        {formatDate(campaign.scheduledFor)}
                      </span>
                    ) : campaign.sentAt ? (
                      <span title="Sent At">{formatDate(campaign.sentAt)}</span>
                    ) : (
                      <span className="text-gray-500">Not sent</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {campaign.sentCount > 0 ? (
                        <>
                          <div>Sent: {campaign.sentCount}</div>
                          <div>
                            Opens: {campaign.openCount} (
                            {Math.round(
                              (campaign.openCount / campaign.sentCount) * 100
                            )}
                            %)
                          </div>
                          <div>
                            Clicks: {campaign.clickCount} (
                            {Math.round(
                              (campaign.clickCount / campaign.sentCount) * 100
                            )}
                            %)
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-500">No data</span>
                      )}
                    </div>
                  </td>                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="text-primary hover:text-primary/80 underline-offset-4 hover:underline mr-4"
                    >
                      Edit
                    </Link>
                    {(campaign.status === "draft" ||
                      campaign.status === "scheduled") && (
                      <button
                        onClick={() => router.push(`/${locale}/dashboard/campaigns/${campaign.id}/send`)}
                        className="text-emerald-600 hover:text-emerald-800 hover:underline underline-offset-4 mr-4"
                      >
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-destructive hover:text-destructive/80 hover:underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>      ) : (
        <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground shadow-sm">
          <p className="mb-4">No campaigns found. Create your first campaign to get started.</p>
          <Button asChild variant="outline">
            <Link href={`/dashboard/campaigns/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
