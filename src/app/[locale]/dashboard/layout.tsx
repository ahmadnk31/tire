import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import DashboardClient from "@/components/dashboard/dashboard-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Only allow admin or retailer to access dashboard
  if (session.user.role !== "ADMIN" && session.user.role !== "RETAILER") {
    redirect("/");
  }

  // Pass session user to client component
  return <DashboardClient user={session.user}>{children}</DashboardClient>;
}