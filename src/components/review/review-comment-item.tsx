import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewComment } from '@/hooks/use-reviews';

interface ReviewCommentItemProps {
  comment: ReviewComment;
}

export function ReviewCommentItem({ comment }: ReviewCommentItemProps) {
  const userName = comment.user?.name || 'Anonymous';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-3">
      <Avatar className="h-6 w-6">
        <AvatarImage src={comment.user?.image || ''} alt={userName} />
        <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{userName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), 'MMM d, yyyy')}
          </span>
        </div>
        <p className="text-sm">{comment.content}</p>
      </div>
    </div>
  );
}