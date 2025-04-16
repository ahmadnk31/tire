import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { InstallationDetail } from "@/components/dashboard/installations/installation-detail";
import { InstallationAdditionalServices } from "@/components/dashboard/installations/installation-additional-services";
import { NewInstallationForm } from "@/components/dashboard/installations/new-installation-form";

interface InstallationPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export async function generateMetadata({ params }: InstallationPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "Dashboard.installations" });
  const {id}=await params;
  // Check if we're on the "new" installation page
  if (id === "new") {
    return {
      title: t("form.createTitle"),
      description: t("form.description") || t("detail.description"),
    };
  }

  return {
    title: `${t("detail.title")} #${id.slice(-6)}`,
    description: t("detail.description"),
  };
}

export default async function InstallationPage({ params }: InstallationPageProps) {
  // Check if this is the "new" route
  if (params.id === "new") {
    return (
      <div className="container py-6">
        <NewInstallationForm locale={params.locale} />
      </div>
    );
  }

  // Fetch the installation data server-side for initial render and SEO
  const installation = await prisma.installation.findUnique({
    where: { id: params.id },
    include: { additionalServices: true },
  });

  if (!installation) {
    notFound();
  }

  return <InstallationDetail initialData={installation} id={params.id} />;
}
