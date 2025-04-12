"use client";

import React from "react";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManualShippingBadgeProps {
  trackingNumber?: string;
}

export function ManualShippingBadge({ trackingNumber }: ManualShippingBadgeProps) {
  // Check if this is a manual tracking number
  const isManual = trackingNumber?.startsWith('MANUAL-');
  
  if (!isManual) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 ml-2">
            <Package className="h-3 w-3 mr-1" />
            Manual
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>This shipment was created manually</p>
          <p className="text-xs">{trackingNumber}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
