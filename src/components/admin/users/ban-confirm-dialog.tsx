"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface BanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  isBanned: boolean;
  onConfirm: () => void;
  isPending: boolean;
}

export function BanConfirmDialog({
  open,
  onOpenChange,
  userName,
  isBanned,
  onConfirm,
  isPending,
}: BanConfirmDialogProps) {
  const actionType = isBanned ? "unban" : "ban";
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBanned ? "Unban User" : "Ban User"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBanned
              ? `Are you sure you want to unban ${userName}? They will regain access to the system.`
              : `Are you sure you want to ban ${userName}? This will prevent them from accessing the system.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={isBanned ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBanned ? "Yes, Unban" : "Yes, Ban"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
