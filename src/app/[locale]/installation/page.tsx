import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import InstallationPage from "@/components/installation/InstallationPage";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Homepage.services.installationPage" });

  return {
    title: t("hero.title"),
    description: t("hero.subtitle"),
  };
}

export default async function Page({ params: { locale } }: { params: { locale: string } }) {
  return <InstallationPage />;
}
