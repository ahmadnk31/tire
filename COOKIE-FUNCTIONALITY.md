# Cookie Functionality - Tire Shop Application

This document outlines the cookie functionality implemented in the Tire Shop application, including features for cookie consent, recently viewed products, preferences, and more.

## Overview

The Tire Shop application uses cookies for several purposes:

1. **Cookie Consent Management**: GDPR-compliant cookie consent mechanism
2. **User Preferences**: Storing user preferences like language and theme
3. **Recently Viewed Products**: Tracking which products a user has viewed
4. **Session Management**: Enhancing the user experience with session cookies

## Implementation Details

### Cookie Utilities

The core cookie functionality is implemented in `/src/lib/cookies.ts`, which provides:

- Basic cookie operations (get, set, remove, check)
- Type-safe cookie names to prevent typos
- JSON handling for complex data structures
- Security options (HttpOnly, SameSite, Secure)
- Utility functions for specific cookie types

### Cookie Consent Banner

The application includes a fully featured cookie consent banner that:

- Shows on first visit
- Allows users to accept all, reject all, or customize cookie preferences
- Persists user choices in cookies
- Provides a settings modal for detailed cookie control
- Categorizes cookies into different types (necessary, preferences, analytics, marketing)

Related components:
- `/src/components/cookie-consent.tsx`: The main cookie consent banner
- `/src/components/providers/cookie-consent-provider.tsx`: Context provider for cookie consent state
- `/src/components/cookie-settings-button.tsx`: Button to reopen cookie preferences

### Recently Viewed Products

The application tracks recently viewed products to enhance the shopping experience:

- Products viewed by the user are automatically tracked
- The recently viewed products are displayed on the product detail page
- A maximum of 10 products are stored by default
- The most recently viewed product appears first

Related components:
- `/src/components/product-view-tracker.tsx`: Tracks product views
- `/src/components/recently-viewed-products.tsx`: Displays recently viewed products
- `/src/hooks/use-cookies.ts`: React hooks for cookie management

### React Hooks

For easy integration with React components, custom hooks are provided:

- `useCookie`: General purpose hook for any cookie
- `useRecentProducts`: Specific hook for recently viewed products
- `useUserPreferences`: Hook for managing user preferences

Example usage:

```tsx
// Using the useCookie hook
const [theme, setTheme, removeTheme] = useCookie('theme_preference', 'light');

// Using the useRecentProducts hook
const { recentProducts, addProduct, clearProducts } = useRecentProducts();

// Using the useUserPreferences hook
const { preferences, updatePreference, clearPreferences } = useUserPreferences();
```

## Cookie Types and Purpose

| Cookie Name              | Purpose                               | Duration | Type        |
|--------------------------|---------------------------------------|----------|-------------|
| consent_given            | Stores user consent preferences       | 1 year   | Necessary   |
| language_preference      | Stores user language preference       | 1 year   | Preferences |
| theme_preference         | Stores user theme preference          | 1 year   | Preferences |
| recently_viewed_products | Tracks recently viewed products       | 30 days  | Preferences |
| user_preferences         | Stores user UI preferences            | 1 year   | Preferences |
| shopping_cart            | Stores shopping cart contents         | 30 days  | Preferences |
| session_id               | Manages user session                  | Session  | Necessary   |
| last_visited             | Records last visit timestamp          | 1 year   | Analytics   |

## Integration with Other Features

### Multi-language Support

The cookie functionality integrates with the multi-language features of the application:

- Language preferences can be saved in cookies
- Localized content is shown based on the stored preference
- Cookie consent banner content is also localized

### Theme Support

The application's dark/light theme preferences are stored in cookies:

- Theme choices persist across visits
- The application loads the correct theme immediately on page load
- Users can change preferences through the UI

## Testing

Cookie functionality is thoroughly tested:

- Unit tests for all cookie utility functions
- Integration tests for React hooks
- End-to-end tests for cookie consent flows

## Future Enhancements

1. **Analytics Integration**: Better integration with analytics platforms based on consent
2. **Server-side Cookies**: Enhancing security with server-side cookie validation
3. **Cross-device Sync**: Allowing users to sync preferences across devices
4. **Cookie Expiry Management**: Add more granular control over cookie expiration
5. **Personalization**: Using cookie data to personalize the shopping experience 