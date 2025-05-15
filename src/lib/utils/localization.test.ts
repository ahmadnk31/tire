import { getLocalizedContent, getLocalizedDescription, getLocalizedShortDescription } from './localization';

describe('Localization Utilities', () => {
  describe('getLocalizedContent', () => {
    it('should return localized content when available for requested locale', () => {
      const localizedContent = {
        'en': 'English content',
        'de': 'Deutscher Inhalt',
        'fr': 'Contenu français'
      };
      const defaultContent = 'Default content';
      
      expect(getLocalizedContent(localizedContent, defaultContent, 'de')).toBe('Deutscher Inhalt');
    });
    
    it('should return default content when locale not available', () => {
      const localizedContent = {
        'en': 'English content',
        'fr': 'Contenu français'
      };
      const defaultContent = 'Default content';
      
      expect(getLocalizedContent(localizedContent, defaultContent, 'de')).toBe('Default content');
    });
    
    it('should return null when both localized and default content are null', () => {
      const localizedContent = null;
      const defaultContent = null;
      
      expect(getLocalizedContent(localizedContent, defaultContent, 'en')).toBeNull();
    });
    
    it('should handle undefined values properly', () => {
      const localizedContent = undefined;
      const defaultContent = 'Default content';
      
      expect(getLocalizedContent(localizedContent, defaultContent, 'en')).toBe('Default content');
    });
  });
  
  describe('getLocalizedDescription', () => {
    it('should return localized description when available', () => {
      const product = {
        description: 'Default description',
        localized_descriptions: {
          'en': 'English description',
          'es': 'Descripción en español'
        }
      };
      
      expect(getLocalizedDescription(product, 'es')).toBe('Descripción en español');
    });
    
    it('should fall back to default description when locale not available', () => {
      const product = {
        description: 'Default description',
        localized_descriptions: {
          'en': 'English description'
        }
      };
      
      expect(getLocalizedDescription(product, 'it')).toBe('Default description');
    });
  });
  
  describe('getLocalizedShortDescription', () => {
    it('should return localized short description when available', () => {
      const product = {
        short_description: 'Default short description',
        localized_short_descriptions: {
          'en': 'English short description',
          'fr': 'Description courte en français'
        }
      };
      
      expect(getLocalizedShortDescription(product, 'fr')).toBe('Description courte en français');
    });
    
    it('should fall back to default short description when locale not available', () => {
      const product = {
        short_description: 'Default short description',
        localized_short_descriptions: {
          'en': 'English short description'
        }
      };
      
      expect(getLocalizedShortDescription(product, 'ru')).toBe('Default short description');
    });
  });
}); 