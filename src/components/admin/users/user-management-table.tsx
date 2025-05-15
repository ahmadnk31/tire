"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MailIcon, Edit2Icon, Trash2Icon, BanIcon, UserIcon, Search, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BanConfirmDialog } from "./ban-confirm-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useGetUsers, useSetUserBanStatus, useDeleteUser } from "@/hooks/use-admin-queries";
import { User } from "@/hooks/use-admin-queries";

interface UserManagementTableProps {
  onSendEmail: (userId: string, email: string) => void;
  onEdit: (userId: string) => void;
}

export function UserManagementTable({ onSendEmail, onEdit }: UserManagementTableProps) {
  const { data: users, isLoading, error } = useGetUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const banUserMutation = useSetUserBanStatus();
  const deleteUserMutation = useDeleteUser();

  // Filter users based on search term
  const filteredUsers = users?.filter(user => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.role.toLowerCase().includes(searchTermLower)
    );
  });

  const handleOpenBanDialog = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      await banUserMutation.mutateAsync({
        userId: selectedUser.id,
        isBanned: !selectedUser.isBanned
      });
      setBanDialogOpen(false);
    } catch (error) {
      console.error("Error updating user ban status:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (isLoading) {
    return <UserManagementTableSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading users: {(error as Error).message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage user accounts and their access.</CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or role"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : (user.role === "RETAILER" ? "secondary" : "outline")}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onSendEmail(user.id, user.email)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <MailIcon className="h-4 w-4" />
                          <span>Send Email</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => onEdit(user.id)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit2Icon className="h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => handleOpenBanDialog(user)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <BanIcon className="h-4 w-4" />
                          <span>{user.isBanned ? "Unban" : "Ban"}</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => handleOpenDeleteDialog(user)}
                          className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2Icon className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchTerm ? "No users matching your search" : "No users found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {selectedUser && (
        <>
          <BanConfirmDialog
            open={banDialogOpen}
            onOpenChange={setBanDialogOpen}
            userName={selectedUser.name}
            isBanned={!!selectedUser.isBanned}
            onConfirm={handleBanUser}
            isPending={banUserMutation.isPending}
          />

          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            userName={selectedUser.name}
            onConfirm={handleDeleteUser}
            isPending={deleteUserMutation.isPending}
          />
        </>
      )}
    </Card>
  );
}

function UserManagementTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
        <Skeleton className="h-10 w-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
