import { Metadata } from "next";
import UsersManagement from "@/components/admin/users/users-management";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export const metadata: Metadata = {
  title: "User Management",
  description: "Admin interface for managing users",
};

export default async function UsersPage() {
  // Check for admin permissions on the server side
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }
  
  return <UsersManagement />;
}
