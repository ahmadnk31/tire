import { Metadata } from "next"
import NewslettersPageClient from "@/components/dashboard/newsletters/newsletters-page-client"

export const metadata: Metadata = {
  title: "Newsletters Management",
  description: "Manage newsletters and email campaigns for your tire business",
}

export default function NewslettersPage() {
  return (
    <NewslettersPageClient />
  )
}
