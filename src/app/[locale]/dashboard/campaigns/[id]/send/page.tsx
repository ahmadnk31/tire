"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  htmlTemplate: string;
  textTemplate: string | null;
  promotion: {
    id: string;
    title: string;
  };
}

// Function to fetch a campaign by ID
const fetchCampaign = async (id: string): Promise<Campaign> => {
  const response = await fetch(`/api/campaigns/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch campaign");
  }
  const data = await response.json();
  return data.campaign;
};

// Function to send a campaign
const sendCampaign = async (id: string) => {
  const response = await fetch(`/api/campaigns/${id}/send`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || errorData.message || "Failed to send campaign");
  }

  return response.json();
};

export default function SendCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<any>(null);

  // Query for fetching the campaign
  const {
    data: campaign,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['campaign', params.id],
    queryFn: () => fetchCampaign(params.id),
    onError: (err: Error) => {
      setError(err.message);
    }
  });
  // Mutation for sending the campaign
  const sendMutation = useMutation({
    mutationFn: () => sendCampaign(params.id),
    onSuccess: (result) => {
      // Set the result for display
      setSentResult(result);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['campaign', params.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleSendCampaign = async () => {
    if (!campaign) return;
    
    if (!window.confirm(`Are you sure you want to send this campaign? This action cannot be undone.`)) {
      return;
    }
    
    setError(null);
    sendMutation.mutate();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
        Campaign not found or failed to load.
      </div>
    );
  }

  // Check if campaign can be sent
  const canSend = campaign.status === "draft" || campaign.status === "scheduled";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Send Campaign</h1>
        <Link
          href="/dashboard/campaigns"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to List
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      {sentResult && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          <h3 className="font-bold">Campaign Sent Successfully!</h3>
          <p>Total emails sent: {sentResult.totalSent}</p>
          {sentResult.totalFailed > 0 && (
            <p className="text-amber-700">Failed emails: {sentResult.totalFailed}</p>
          )}
          <div className="mt-4">
            <Link
              href="/dashboard/campaigns"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Return to Campaigns List
            </Link>
          </div>
        </div>
      )}

      {!canSend && !sentResult && (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
          This campaign cannot be sent because it has already been sent or is in progress.
        </div>
      )}

      {!sentResult && (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">Campaign Details</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Campaign Name</p>
                <p className="mt-1">{campaign.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Subject</p>
                <p className="mt-1">{campaign.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <p className="mt-1 capitalize">{campaign.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Related Promotion</p>
                <p className="mt-1">{campaign.promotion.title}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium mb-4">Preview Email</h2>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Subject</h3>
              <div className="p-3 bg-gray-100 rounded">{campaign.subject}</div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">HTML Content</h3>
              <div className="border rounded p-4 max-h-96 overflow-auto">
                <iframe 
                  title="Email HTML Preview" 
                  srcDoc={campaign.htmlTemplate}
                  className="w-full"
                  style={{ height: '400px' }}
                ></iframe>
              </div>
            </div>
            
            {campaign.textTemplate && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Plain Text Version</h3>
                <pre className="p-3 bg-gray-100 rounded overflow-auto whitespace-pre-wrap text-sm" style={{ maxHeight: '200px' }}>
                  {campaign.textTemplate}
                </pre>
              </div>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Link
                href={`/dashboard/campaigns/${params.id}`}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-center"
              >
                Edit Campaign
              </Link>
              {canSend && (
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {sending ? "Sending..." : "Send Campaign Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
