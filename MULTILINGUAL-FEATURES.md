# Multilingual Features - Tire Shop Application

This document outlines the implementation of multilingual features in the Tire Shop application, particularly focusing on product descriptions in multiple languages.

## Features Implemented

### 1. Localized Product Descriptions

- **Database Schema Updates**
  - Added `localized_descriptions` field (JSONB): Stores multiple language versions of the full product description
  - Added `localized_short_descriptions` field (JSONB): Stores multiple language versions of the product short description
  - Created migration scripts for the schema changes

- **UI Components**
  - Created a reusable `LocalizedEditor` component for editing content in multiple languages
  - Integrated the editor into the product form for both short and full descriptions
  - Support for rich text editing in multilingual content

### 2. Localized Editor Component

The `LocalizedEditor` component provides:

- Tab-based interface for switching between languages
- Ability to add new languages through a dialog
- Support for both plain text and rich text content
- Visual indicators for default language vs additional languages
- State management for multilingual content

### 3. Data Structure

The localized content is stored as a JSON object with language codes as keys:

```json
{
  "en": "English description text",
  "es": "Spanish description text",
  "fr": "French description text"
}
```

This structure enables:
- Easy lookup of content by language code
- Flexibility to add or remove languages as needed
- Compact storage in a single database field

## Usage in Product Management

### Adding a Product Description in Multiple Languages

1. Enter the default description in English using the "Default Language" field
2. Switch to the "Multiple Languages" section
3. Click the "+" button to add a new language
4. Select the desired language from the dropdown
5. Enter the translated content in the editor
6. Repeat for additional languages as needed

### Handling the Data in API Routes

When processing product data in API routes:

1. The localized descriptions are sent as JSON-stringified objects
2. They are parsed and stored in the database as JSONB fields
3. When retrieving product data, the application can select the appropriate language based on user preferences

## Front-End Implementation

The product display pages can use the localized descriptions by:

1. Checking for the presence of localized content
2. Matching the user's language preference with available translations
3. Falling back to the default language if no matching translation exists

## User-Facing Implementation

The multilingual features are now fully implemented across the user-facing side of the application, providing a seamless experience for international customers:

### Product Detail Page

The product detail page has been enhanced to display content in the user's preferred language:

- **Description Display**: The main product description is automatically displayed in the user's selected language (based on the URL locale parameter)
- **Fallback Mechanism**: If a translation isn't available for the user's language, the system automatically falls back to the default language
- **Rich Text Preservation**: All formatting from the rich text editor is preserved in the translated content

### Product Listings

Product listings across the application now support multilingual content:

- **Product Cards**: All product cards on category pages, brand pages, and the main products page display localized short descriptions
- **Consistent Experience**: The same language is used throughout the browsing experience based on the user's locale preference

### Utility Functions

Several helper utilities have been implemented to make localized content handling consistent:

- **`getLocalizedContent()`**: A generic utility for retrieving localized content with fallback support
- **`getLocalizedDescription()`**: Specifically for retrieving a product's localized full description
- **`getLocalizedShortDescription()`**: For retrieving a product's localized short description

These functions handle all the logic for language selection and fallback, making it easy to display the right content anywhere in the application.

### Installation and Configuration

No additional configuration is needed beyond the existing Next.js internationalization setup. The application automatically uses the locale from the URL path to determine which language content to display.

## Future Enhancements

1. **Automated Translation**
   - Integration with translation APIs to assist with content creation
   - Machine learning suggestions for translations

2. **Localization Workflow**
   - Status tracking for translations (complete, in progress, needs review)
   - Assignments for translators and reviewers

3. **Extended Localization**
   - Apply the same approach to other content types (categories, attributes, etc.)
   - Support for right-to-left (RTL) languages in the editor 