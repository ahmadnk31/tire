"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

interface Promotion {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [campaignType, setCampaignType] = useState<"custom" | "appointment">("custom");
  const [appointmentType, setAppointmentType] = useState<"confirmation" | "reminder">("confirmation");
  
  const [formData, setFormData] = useState({
    promotionId: "",
    name: "",
    subject: "",
    htmlTemplate: "",
    textTemplate: "",
    scheduledFor: "",
  });
  // Fetch promotions using TanStack Query
  const { data: fetchedPromotions = [], error: promotionsError } = useQuery({
    queryKey: ['promotions', 'active'],
    queryFn: async () => {
      const response = await fetch("/api/promotions?isActive=true");
      if (!response.ok) {
        throw new Error("Failed to fetch promotions");
      }
      const data = await response.json();
      return data.promotions || [];
    }
  });
  
  // Update local state from query results
  useEffect(() => {
    if (fetchedPromotions.length > 0) {
      setPromotions(fetchedPromotions);
    }
    
    if (promotionsError) {
      setError((promotionsError as Error).message);
    }
  }, [fetchedPromotions, promotionsError]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let endpoint = "/api/campaigns";
      let payload;

      if (campaignType === "appointment") {
        // For appointment-type campaigns
        payload = {
          type: "appointment",
          promotionId: formData.promotionId,
          appointmentType,
        };
      } else {
        // For custom campaigns
        if (!formData.htmlTemplate) {
          throw new Error("HTML template is required");
        }

        payload = {
          promotionId: formData.promotionId,
          name: formData.name,
          subject: formData.subject,
          htmlTemplate: formData.htmlTemplate,
          textTemplate: formData.textTemplate,
          scheduledFor: formData.scheduledFor || undefined,
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }

      // Redirect to campaigns list on success
      router.push("/dashboard/campaigns");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Campaign</h1>
        <Link
          href="/dashboard/campaigns"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-md p-6">
        {/* Campaign Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Type
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setCampaignType("custom")}
              className={`px-4 py-2 rounded ${
                campaignType === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Custom Campaign
            </button>
            <button
              type="button"
              onClick={() => setCampaignType("appointment")}
              className={`px-4 py-2 rounded ${
                campaignType === "appointment"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              Appointment Campaign
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Promotion Selection - Required for both types */}
          <div className="mb-4">
            <label htmlFor="promotionId" className="block text-sm font-medium text-gray-700 mb-1">
              Promotion <span className="text-red-500">*</span>
            </label>
            <select
              id="promotionId"
              name="promotionId"
              value={formData.promotionId}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a promotion</option>
              {promotions.map((promotion) => (
                <option key={promotion.id} value={promotion.id}>
                  {promotion.title}
                </option>
              ))}
            </select>
          </div>

          {campaignType === "appointment" ? (
            // Appointment-specific fields
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Email Type <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setAppointmentType("confirmation")}
                  className={`px-4 py-2 rounded ${
                    appointmentType === "confirmation"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  Confirmation Email
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentType("reminder")}
                  className={`px-4 py-2 rounded ${
                    appointmentType === "reminder"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  Reminder Email
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This will create a campaign using our pre-built appointment email templates.
              </p>
            </div>
          ) : (
            // Custom campaign fields
            <>
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the HTML content for your email campaign.
                </p>
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
                <p className="text-sm text-gray-500 mt-1">
                  Optional plain text version for email clients that don't support HTML.
                </p>
              </div>

              <div className="mb-6">
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
            </>
          )}

          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard/campaigns"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
