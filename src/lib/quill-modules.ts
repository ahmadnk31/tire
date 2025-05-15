/**
 * Safely initialize and register Quill modules on the client-side only
 * This avoids SSR issues with modules that require DOM access
 */

export function initQuillModules(Quill: any) {
  // Only register modules on the client side
  if (typeof window === 'undefined') return;
  
  try {
    // Import the image resize module dynamically
    import('quill-image-resize-module')
      .then(({ ImageResize }) => {
        try {
          // Register the module with Quill
          Quill.register('modules/imageResize', ImageResize);
        } catch (err) {
          console.warn('Failed to register ImageResize module:', err);
        }
      })
      .catch(err => console.warn('Failed to import quill-image-resize-module:', err));
    
    // You can add other module imports and registrations here
    
  } catch (error) {
    console.warn('Error initializing Quill modules:', error);
  }
}

/**
 * Check if code is running in browser environment
 * Useful for conditional imports and rendering
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
