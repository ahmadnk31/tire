import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";

// Import the client component dynamically to avoid SSR issues
const TranslationsDashboard = dynamic(
  () => import("./page")
  
);

export default async function TranslationsPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("Dashboard");
  
  // Check if user is authenticated and has admin role
  if (!session?.user) {
    redirect("/login");
  }
  
  // Check if user has admin permissions
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t("translationsTitle") || "Translations Management"}</h2>
      </div>
      
      <TranslationsDashboard />
    </div>
  );
}
