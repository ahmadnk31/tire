import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import { EmailTemplate, TemplateData } from '../types';
import { getTranslations } from 'next-intl/server';


// Cache templates to avoid reading from disk on every request
const templateCache: Record<string, HandlebarsTemplateDelegate> = {};

/**
 * Renders an email template with the provided data and user's locale
 * 
 * @param template The template name to render
 * @param data Template data including locale
 * @returns Object containing rendered html and plain text versions
 */
export async function render(
  template: EmailTemplate,
  data: TemplateData
): Promise<{ html: string; text: string }> {
  try {
    const locale = data.locale || 'en';
    const emailTranslations = await getTranslations('Email');
    
    // Load the template for the user's locale, with fallback to English
    const htmlTemplate = await getCompiledTemplate(`${template}/${locale}.html`, `${template}/en.html`);
    const textTemplate = await getCompiledTemplate(`${template}/${locale}.txt`, `${template}/en.txt`);
    
    // Combine template data with translations for use in templates
    const templateData = {
      ...data,
      t: (key: string) => emailTranslations(key),
    };
    
    return {
      html: htmlTemplate(templateData),
      text: textTemplate(templateData),
    };
  } catch (error) {
    console.error(`Error rendering email template ${template}:`, error);
    throw new Error(`Failed to render email template: ${(error as Error).message}`);
  }
}

/**
 * Gets or compiles a template, with fallback to a default template
 * 
 * @param templatePath Primary template path to try
 * @param fallbackPath Fallback template path if primary doesn't exist
 * @returns Compiled Handlebars template function
 */
async function getCompiledTemplate(
  templatePath: string,
  fallbackPath: string
): Promise<HandlebarsTemplateDelegate> {
  // Check if template is already cached
  if (templateCache[templatePath]) {
    return templateCache[templatePath];
  }
  
  try {
    // Try to read the localized template
    const fullPath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', templatePath);
    const templateSource = await fs.readFile(fullPath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateSource);
    templateCache[templatePath] = compiledTemplate;
    return compiledTemplate;
  } catch (error) {
    // If file doesn't exist or can't be read, try the fallback
    if (!fallbackPath) {
      throw new Error(`Failed to load email template at ${templatePath} and no fallback provided`);
    }
    
    // Don't recursively try fallbacks to avoid infinite loops
    const fullPath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', fallbackPath);
    const templateSource = await fs.readFile(fullPath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateSource);
    templateCache[templatePath] = compiledTemplate; // Cache the fallback under the requested path
    return compiledTemplate;
  }
}
