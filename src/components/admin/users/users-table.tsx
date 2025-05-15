import React from "react";
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
import { MoreHorizontal, MailIcon, Edit2Icon, Trash2Icon, BanIcon, UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { EmailDialog } from "./email-dialog";
import { BanConfirmDialog } from "./ban-confirm-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useGetUsers, useSetUserBanStatus, useDeleteUser } from "@/hooks/use-admin-queries";

export function UsersTable() {
  const { data: users, isLoading, error } = useGetUsers();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const banUserMutation = useSetUserBanStatus();
  const deleteUserMutation = useDeleteUser();

  const handleOpenEmailDialog = (user: any) => {
    setSelectedUser(user);
    setEmailDialogOpen(true);
  };

  const handleOpenBanDialog = (user: any) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleBanUser = async (isBanned: boolean) => {
    if (!selectedUser) return;
    
    try {
      await banUserMutation.mutateAsync({
        userId: selectedUser.id,
        isBanned
      });
      setBanDialogOpen(false);
    } catch (error) {
      console.error("Error banning user:", error);
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
    return <UsersTableSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading users: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage user accounts and their access.</CardDescription>
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
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <UserIcon className="h-8 w-8 p-1 rounded-full bg-muted" />
                    )}
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
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
                          onClick={() => handleOpenEmailDialog(user)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <MailIcon className="h-4 w-4" />
                          <span>Email</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link 
                            href={`/admin/users/edit/${user.id}`}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Edit2Icon className="h-4 w-4" />
                            <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => handleOpenBanUser(user)}
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
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {selectedUser && (
        <>
          <EmailDialog 
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            user={selectedUser}
          />

          <BanConfirmDialog
            open={banDialogOpen}
            onOpenChange={setBanDialogOpen}
            user={selectedUser}
            onConfirm={handleBanUser}
          />

          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            user={selectedUser}
            onConfirm={handleDeleteUser}
          />
        </>
      )}
    </Card>
  );
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
