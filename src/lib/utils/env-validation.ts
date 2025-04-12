/**
 * This utility validates that all required environment variables are set
 */

type EnvironmentVariable = {
  key: string;
  required: boolean;
};

/**
 * List of environment variables used in the application
 */
const envVariables: EnvironmentVariable[] = [
  // Database
  { key: 'DATABASE_URL', required: true },
  
  // AWS Configuration
  { key: 'AWS_REGION', required: true },
  { key: 'AWS_ACCESS_KEY_ID', required: true },
  { key: 'AWS_SECRET_ACCESS_KEY', required: true },
  
  // S3 Configuration
  { key: 'S3_BUCKET_NAME', required: true },
  
  // SES Configuration
  { key: 'SES_FROM_EMAIL', required: true },
  
  // NextAuth Configuration
  { key: 'NEXTAUTH_URL', required: true },
  { key: 'NEXTAUTH_SECRET', required: true },
  
  // Application Settings
  { key: 'ADMIN_EMAIL', required: false },
];

/**
 * Validates that all required environment variables are set
 * @returns Object containing missing variables and validation status
 */
export function validateEnvironment(): {
  isValid: boolean;
  missingVariables: string[];
} {
  const missingVariables: string[] = [];
  
  for (const { key, required } of envVariables) {
    if (required && (!process.env[key] || process.env[key] === '')) {
      missingVariables.push(key);
    }
  }
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Logs environment validation results
 * Call this function during app initialization to ensure environment is properly set up
 */
export function logEnvironmentValidation(): void {
  const { isValid, missingVariables } = validateEnvironment();
  
  if (!isValid) {
    console.error('❌ Environment validation failed. Missing variables:');
    missingVariables.forEach(variable => {
      console.error(`  - ${variable}`);
    });
    console.error('Please check your .env file and make sure these variables are set.');
  } else {
    console.log('✅ Environment validation passed.');
  }
}