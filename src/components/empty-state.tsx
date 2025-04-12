import Image from "next/image";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  image?: string;
}

export function EmptyState({ title, description, action, image }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed">
      {image ? (
        <div className="relative w-32 h-32 mb-6">
          <Image
            src={image}
            alt="Empty state"
            fill
            className="object-contain opacity-75"
          />
        </div>
      ) : (
        <div className="w-20 h-20 mb-6 rounded-full bg-muted flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}