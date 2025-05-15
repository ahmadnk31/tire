"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSendUserEmail } from "@/hooks/use-admin-queries";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "./rich-text-editor";

interface UserEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string | null;
}

export function UserEmailDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userEmail 
}: UserEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  
  const sendEmailMutation = useSendUserEmail();

  const handleSendEmail = async () => {
    if (!userId || !userEmail) {
      toast.error("User information is missing");
      return;
    }
    
    if (!subject.trim() || !content.trim()) {
      toast.error("Please provide both subject and content for the email");
      return;
    }

    try {
      await sendEmailMutation.mutateAsync({
        userId,
        subject,
        content,
      });

      toast.success(`Email sent to ${userEmail} successfully`);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email. Please try again.");
    }
  };

  const resetForm = () => {
    setSubject("");
    setContent("");
  };

  if (!userId || !userEmail) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose and send an email to {userEmail}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="content">Message</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your message here..."
              className="min-h-[200px] border rounded-md"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
