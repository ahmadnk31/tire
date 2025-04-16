"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useInstallations } from "@/hooks/use-installations";
import { InstallationsTable } from "./installations-table";
import { InstallationsFilter } from "./installations-filter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon } from "lucide-react";
import { InstallationStatus } from "@/types";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

export default function InstallationsClient() {
  const t = useTranslations("Dashboard.installations");
  const router = useRouter();
  const [filters, setFilters] = useState<{
    status: InstallationStatus | undefined;
    dateFrom: undefined;
    dateTo: undefined;
    search: string;
    limit: number;
    offset: number;
  }>({
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    search: "",
    limit: 10,
    offset: 0,
  });
  
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // When tab changes, update the status filter
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "all") {
      setFilters((prev) => ({ ...prev, status: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, status: value as InstallationStatus }));
    }
  };
  
  // Get installations with current filters
  const { data, isLoading, error } = useInstallations(filters);
  
 
  
  // Handle pagination
  const handlePaginationChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }));
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset to first page when filters change
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
            <TabsTrigger value="SCHEDULED">{t("tabs.scheduled")}</TabsTrigger>
            <TabsTrigger value="CONFIRMED">{t("tabs.confirmed")}</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">{t("tabs.inProgress")}</TabsTrigger>
            <TabsTrigger value="COMPLETED">{t("tabs.completed")}</TabsTrigger>
            <TabsTrigger value="CANCELED">{t("tabs.canceled")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button asChild className="whitespace-nowrap">
            <Link href="/dashboard/installations/new">
          <PlusIcon className="mr-2 h-4 w-4" />
          {t("actions.create")}
            </Link>
        </Button>
      </div>
      
      <InstallationsFilter currentFilters={filters} onFilterChange={handleFilterChange} />

      <InstallationsTable 
        installations={data?.installations || []}
        isLoading={isLoading}
        pagination={{
          page: Math.floor(filters.offset / filters.limit) + 1,
          pageSize: filters.limit,
          totalItems: data?.pagination?.total || 0,
          onPageChange: handlePaginationChange,
        }}
      />
    </div>
  );
}
