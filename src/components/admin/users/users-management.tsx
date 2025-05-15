"use client";

import React, { useState } from "react";
import { UserManagementTable } from "./user-management-table";
import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { UserEmailDialog } from "./user-email-dialog";
import { UserFormDialog } from "./user-form-dialog";

export default function UsersManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  const handleSendEmail = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setIsEmailDialogOpen(true);
  };

  const handleEdit = (userId: string) => {
    setSelectedUserId(userId);
    setIsUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <AdminHeader 
        heading="User Management" 
        description="Create, edit, delete, and manage user accounts. You can also send emails to users."
      >
        <Button variant="default" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </AdminHeader>

      <UserManagementTable 
        onSendEmail={handleSendEmail} 
        onEdit={handleEdit}
      />
      
      {/* Create user dialog */}
      <UserFormDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
      />

      {/* Update user dialog */}
      <UserFormDialog 
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        mode="update"
        userId={selectedUserId}
      />

      {/* Email dialog */}
      <UserEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
      />
    </div>
  );
}
