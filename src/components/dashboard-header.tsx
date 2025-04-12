import { ReactNode } from "react";

interface DashboardHeaderProps {
  heading: string;
  description?: string;
  children?: ReactNode;
}

export function DashboardHeader({
  heading,
  description,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{heading}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}