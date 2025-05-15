"use client";

import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/providers/cookie-consent-provider";
import { ButtonProps } from "react-day-picker";

interface CookieSettingsButtonProps extends Omit<ButtonProps, 'onClick'> {
  label?: string;
}

/**
 * A button component that opens the cookie preferences modal
 */
export function CookieSettingsButton({
  label = "Cookie Settings",
  ...props
}: CookieSettingsButtonProps) {
  const { openPreferences } = useCookieConsent();

  return (
    <Button
      variant={props.variant || "outline"}
      size={props.size || "sm"}
      onClick={openPreferences}
      {...props}
    >
      {label}
    </Button>
  );
} 