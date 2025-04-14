"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

interface PromoCodeButtonProps {
  code: string;
}

export function PromoCodeButton({ code }: PromoCodeButtonProps) {
  const t = useTranslations("Deals");
  const [codeCopied, setCodeCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="border rounded-lg p-4 bg-muted flex items-center justify-between">
        <code className="font-mono text-lg font-bold">{code}</code>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={copyToClipboard}
          className="h-8"
        >
          {codeCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">
            {codeCopied ? t('detail.codeCopied') : t('detail.copyCode')}
          </span>
        </Button>
      </div>
      {codeCopied && (
        <div className="absolute -bottom-8 left-0 right-0 text-center text-sm text-green-600">
          {t('detail.codeCopied')}
        </div>
      )}
    </div>
  );
}
