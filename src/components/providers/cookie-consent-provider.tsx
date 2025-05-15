"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { hasCookie, setConsentCookie, COOKIE_NAMES } from '@/lib/cookies';
import { CookieConsent, ConsentOption } from '@/components/cookie-consent';

// Define context types
type CookieConsentContextType = {
  /** Current consent state */
  consent: Record<ConsentOption, boolean>;
  /** Function to update consent values */
  updateConsent: (newConsent: Record<ConsentOption, boolean>) => void;
  /** Check if user has given general consent */
  hasConsent: boolean;
  /** Open the cookie preferences modal */
  openPreferences: () => void;
};

// Create context with default values
const CookieConsentContext = createContext<CookieConsentContextType>({
  consent: {
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false
  },
  updateConsent: () => {},
  hasConsent: false,
  openPreferences: () => {},
});

// Custom hook to use the cookie consent context
export const useCookieConsent = () => useContext(CookieConsentContext);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  // Track if user has provided consent
  const [hasConsent, setHasConsent] = useState(false);
  // Store consent values
  const [consent, setConsent] = useState<Record<ConsentOption, boolean>>({
    necessary: true, // Always required
    preferences: false,
    analytics: false,
    marketing: false
  });
  // Control visibility of the cookie preferences modal
  const [showPreferences, setShowPreferences] = useState(false);

  // Check if cookie consent has already been given on mount
  useEffect(() => {
    const hasGivenConsent = hasCookie(COOKIE_NAMES.CONSENT_GIVEN);
    setHasConsent(hasGivenConsent);
  }, []);

  // Function to update consent values
  const updateConsent = (newConsent: Record<ConsentOption, boolean>) => {
    setConsent(newConsent);
    setConsentCookie(true);
    setHasConsent(true);
  };

  // Function to open the cookie preferences modal
  const openPreferences = () => {
    setShowPreferences(true);
  };

  // On consent given callback
  const handleConsent = (consentValues: Record<ConsentOption, boolean>) => {
    setConsent(consentValues);
    setHasConsent(true);
    setShowPreferences(false);
    
    // Here you could integrate with analytics, marketing tools, etc.
    // based on user's consent choices
    
    // For example:
    if (consentValues.analytics) {
      // Initialize analytics
      console.log('Analytics enabled');
    }
    
    if (consentValues.marketing) {
      // Initialize marketing tools
      console.log('Marketing enabled');
    }
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        updateConsent,
        hasConsent,
        openPreferences,
      }}
    >
      {children}
      
      {/* Show cookie consent banner when openPreferences is called */}
      {showPreferences && (
        <CookieConsent
          showPreferences={true}
          onConsent={handleConsent}
        />
      )}
      
      {/* Show initial cookie consent banner (if no consent has been given yet) */}
      {!showPreferences && (
        <CookieConsent
          onConsent={handleConsent}
        />
      )}
    </CookieConsentContext.Provider>
  );
} 