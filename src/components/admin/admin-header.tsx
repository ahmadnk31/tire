import React from "react";

interface AdminHeaderProps {
  heading: string;
  description: string;
  children?: React.ReactNode;
}

export function AdminHeader({ heading, description, children }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
