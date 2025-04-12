import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ReviewCommentFormProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function ReviewCommentForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = 'Write a comment...',
}: ReviewCommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim().length === 0) {
      return;
    }
    
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="min-h-20 resize-none"
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          size="sm"
          disabled={isSubmitting || content.trim().length === 0}
        >
          {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Comment
        </Button>
      </div>
    </form>
  );
}