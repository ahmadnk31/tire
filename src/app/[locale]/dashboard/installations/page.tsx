import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import InstallationsClient from "@/components/dashboard/installations/installations-client";

export const metadata: Metadata = {
  title: "Installation Management",
  description: "Manage customer tire installation appointments",
};

export default async function InstallationsPage() {
  const t = await getTranslations("Dashboard.installations");

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
      </div>
      
      <div className="w-full">
        <InstallationsClient />
      </div>
    </div>
  );
}
