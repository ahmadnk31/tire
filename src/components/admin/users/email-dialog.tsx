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
import {RichTextAdapter} from "@/components/tiptap/rich-text-adapter";

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function EmailDialog({ open, onOpenChange, user }: EmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  
  const sendEmailMutation = useSendUserEmail();

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please provide both subject and content for the email");
      return;
    }

    try {
      await sendEmailMutation.mutateAsync({
        userId: user.id,
        subject,
        content,
      });

      toast.success(`Email sent to ${user.name} successfully`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to {user.name}</DialogTitle>
          <DialogDescription>
            Compose and send an email to {user.email}
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
            <RichTextAdapter
              value={content}
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
            disabled={sendEmailMutation.isPending || !subject.trim() || !content.trim()}
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
