import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { InstallationEditForm } from "@/components/dashboard/installations/installation-edit-form";

interface InstallationEditPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export async function generateMetadata({ params }: InstallationEditPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "Dashboard.installations" });

  return {
    title: `${t("edit.title")} #${params.id.slice(-6)}`,
    description: t("edit.description"),
  };
}

export default async function InstallationEditPage({ params }: InstallationEditPageProps) {
  // Fetch the installation data server-side for initial render
  const installation = await prisma.installation.findUnique({
    where: { id: params.id },
    include: { additionalServices: true },
  });

  if (!installation) {
    notFound();
  }

  return <InstallationEditForm initialData={installation} id={params.id} />;
}
