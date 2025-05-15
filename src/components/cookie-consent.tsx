import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { hasCookie, setConsentCookie } from '@/lib/cookies';

/**
 * Different types of consent options available
 */
export type ConsentOption = 'necessary' | 'preferences' | 'analytics' | 'marketing';

/**
 * Props for the CookieConsent component
 */
interface CookieConsentProps {
  /** Whether to show the detailed preferences view by default */
  showPreferences?: boolean;
  /** Time in milliseconds to wait before showing the banner */
  delay?: number;
  /** Text to show in the banner */
  text?: string;
  /** Callback function when user makes a choice */
  onConsent?: (consent: Record<ConsentOption, boolean>) => void;
}

/**
 * Cookie consent banner component
 */
export function CookieConsent({
  showPreferences = false,
  delay = 1000,
  text = "We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.",
  onConsent
}: CookieConsentProps) {
  // Visibility state of the banner
  const [isVisible, setIsVisible] = useState(false);
  // Whether to show detailed preferences
  const [showDetails, setShowDetails] = useState(showPreferences);
  // Consent state for different cookie categories
  const [consent, setConsent] = useState<Record<ConsentOption, boolean>>({
    necessary: true, // Always required
    preferences: false,
    analytics: false,
    marketing: false
  });

  // Check if user has already given consent
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasConsentCookie = hasCookie('consent_given');
      if (!hasConsentCookie) {
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // Handle accepting all cookies
  const acceptAll = () => {
    const fullConsent = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true
    };
    
    setConsent(fullConsent);
    setConsentCookie(true);
    setIsVisible(false);
    
    if (onConsent) {
      onConsent(fullConsent);
    }
  };

  // Handle accepting only necessary cookies
  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false
    };
    
    setConsent(necessaryOnly);
    setConsentCookie(true);
    setIsVisible(false);
    
    if (onConsent) {
      onConsent(necessaryOnly);
    }
  };

  // Handle saving custom preferences
  const savePreferences = () => {
    setConsentCookie(true);
    setIsVisible(false);
    
    if (onConsent) {
      onConsent(consent);
    }
  };

  // Handle toggling a specific consent option
  const toggleConsent = (option: ConsentOption) => {
    if (option === 'necessary') return; // Cannot toggle necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Don't render anything if the banner shouldn't be visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700">
      {/* Simple banner view */}
      {!showDetails ? (
        <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">{text}</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(true)}
              className="w-full sm:w-auto"
            >
              Cookie Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={acceptNecessary}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button 
              size="sm" 
              onClick={acceptAll}
              className="w-full sm:w-auto"
            >
              Accept All
            </Button>
          </div>
        </div>
      ) : (
        // Detailed preferences view
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Cookie Preferences</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(false)}
              className="h-8 w-8"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            You can choose which cookies you want to allow. You can change these settings at any time, though this may impact functionality of the site.
          </p>
          
          <div className="space-y-4 mb-6">
            {/* Necessary cookies - always enabled */}
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Strictly Necessary Cookies</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  These cookies are essential for you to browse the website and use its features, such as accessing secure areas of the site.
                </p>
              </div>
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={consent.necessary}
                  disabled
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Preferences cookies */}
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Preferences Cookies</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  These cookies allow the website to remember choices you make (such as your language or region) and provide enhanced features.
                </p>
              </div>
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={consent.preferences}
                  onChange={() => toggleConsent('preferences')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Analytics cookies */}
            <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Analytics Cookies</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  These cookies collect information that helps us understand how you use our website, which areas are most popular, and how users navigate the site.
                </p>
              </div>
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={() => toggleConsent('analytics')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
            
            {/* Marketing cookies */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm">Marketing Cookies</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  These cookies track your online activity to help advertisers deliver more relevant advertising or to limit how many times you see an ad.
                </p>
              </div>
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={() => toggleConsent('marketing')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={acceptNecessary}
            >
              Reject All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={acceptAll}
            >
              Accept All
            </Button>
            <Button 
              size="sm" 
              onClick={savePreferences}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 