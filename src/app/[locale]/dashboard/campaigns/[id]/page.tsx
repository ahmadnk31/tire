"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string | null;
  scheduledFor: string | null;
  status: string;
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

// Function to update a campaign
const updateCampaign = async ({
  id,
  data,
}: {
  id: string;
  data: any;
}): Promise<Campaign> => {
  const response = await fetch(`/api/campaigns/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update campaign");
  }

  const result = await response.json();
  return result.campaign;
};

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    htmlTemplate: "",
    textTemplate: "",
    scheduledFor: "",
    status: "",
  });

  // Query for fetching the campaign
  const {
    data: campaign,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['campaign', params.id],
    queryFn: () => fetchCampaign(params.id),
    onSuccess: (data) => {
      // Format the date for the input
      let scheduledForFormatted = "";
      if (data.scheduledFor) {
        const date = new Date(data.scheduledFor);
        scheduledForFormatted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 16);
      }
      
      setFormData({
        name: data.name,
        subject: data.subject,
        htmlTemplate: data.htmlTemplate,
        textTemplate: data.textTemplate || "",
        scheduledFor: scheduledForFormatted,
        status: data.status,
      });
    },
    onError: (err: Error) => {
      setError(err.message);
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  // Mutation for updating a campaign
  const updateMutation = useMutation({
    mutationFn: updateCampaign,
    onMutate: () => {
      setSaving(true);
      setError(null);
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['campaign', params.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      // Redirect to campaigns list on success
      router.push("/dashboard/campaigns");
      router.refresh();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
    onSettled: () => {
      setSaving(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the data for update
    const updateData: any = {
      name: formData.name,
      subject: formData.subject,
      htmlTemplate: formData.htmlTemplate,
      textTemplate: formData.textTemplate || null,
      status: formData.status,
    };
    
    // Only include scheduledFor if it has a value
    if (formData.scheduledFor) {
      updateData.scheduledFor = new Date(formData.scheduledFor).toISOString();
    } else {
      updateData.scheduledFor = null;
    }

    updateMutation.mutate({
      id: params.id,
      data: updateData
    });
  };

  const canEdit = campaign?.status === "draft" || campaign?.status === "scheduled";

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/campaigns"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to List
          </Link>
          {(campaign.status === "draft" || campaign.status === "scheduled") && (
            <Link
              href={`/dashboard/campaigns/${params.id}/send`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Send Campaign
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      {!canEdit && (
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
          This campaign cannot be edited because it has already been sent or is in progress.
          You can view the details but cannot make changes.
        </div>
      )}

      <div className="bg-white shadow-md rounded-md p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            <strong>Campaign ID:</strong> {campaign.id}
          </p>
          <p className="text-sm text-gray-500">
            <strong>Promotion:</strong> {campaign.promotion.title}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={!canEdit}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              disabled={!canEdit}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="htmlTemplate" className="block text-sm font-medium text-gray-700 mb-1">
              HTML Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="htmlTemplate"
              name="htmlTemplate"
              value={formData.htmlTemplate}
              onChange={handleInputChange}
              required
              rows={10}
              disabled={!canEdit}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            ></textarea>
          </div>

          <div className="mb-4">
            <label htmlFor="textTemplate" className="block text-sm font-medium text-gray-700 mb-1">
              Plain Text Content
            </label>
            <textarea
              id="textTemplate"
              name="textTemplate"
              value={formData.textTemplate}
              onChange={handleInputChange}
              rows={5}
              disabled={!canEdit}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            ></textarea>
            <p className="text-sm text-gray-500 mt-1">
              Plain text version for email clients that don't support HTML.
            </p>
          </div>

          {canEdit && (
            <div className="mb-4">
              <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Send (Optional)
              </label>
              <input
                type="datetime-local"
                id="scheduledFor"
                name="scheduledFor"
                value={formData.scheduledFor}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to save as draft without scheduling.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/campaigns"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </Link>
            {canEdit && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
