/**
 * Secrets Manager for Vlossom API
 *
 * SECURITY FIX (C-3): Secure storage for sensitive credentials
 * Reference: Security Review - Private keys should not be stored in plain environment variables
 *
 * Architecture:
 * - Production: Fetches secrets from AWS Secrets Manager
 * - Development: Falls back to environment variables with warnings
 *
 * Supports:
 * - AWS Secrets Manager (primary for production)
 * - Environment variables (development fallback)
 *
 * Usage:
 * - Set AWS_REGION and USE_SECRETS_MANAGER=true for production
 * - Set AWS credentials via AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or IAM role
 * - Define secret names via RELAYER_PRIVATE_KEY_SECRET_NAME
 */

import { logger } from "./logger";

// Cache for fetched secrets (avoid repeated API calls)
const secretsCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Type for AWS SDK client (dynamically imported)
type SecretsManagerClient = {
  send(command: unknown): Promise<{ SecretString?: string }>;
};

let secretsManagerClient: SecretsManagerClient | null = null;
let clientInitialized = false;

/**
 * Initialize AWS Secrets Manager client
 * Only initializes if USE_SECRETS_MANAGER=true and AWS_REGION is set
 */
async function initSecretsManager(): Promise<SecretsManagerClient | null> {
  if (clientInitialized) {
    return secretsManagerClient;
  }

  clientInitialized = true;

  const useSecretsManager = process.env.USE_SECRETS_MANAGER === "true";
  const awsRegion = process.env.AWS_REGION;

  if (!useSecretsManager) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("Secrets Manager not enabled", {
        event: "secrets_manager_disabled",
        warning: "USE_SECRETS_MANAGER is not set to 'true'",
        recommendation: "Enable Secrets Manager for production deployments",
      });
    } else {
      logger.info("Secrets Manager disabled - using environment variables", {
        event: "secrets_manager_skip",
        mode: "development",
      });
    }
    return null;
  }

  if (!awsRegion) {
    logger.warn("AWS_REGION not configured", {
      event: "secrets_manager_skip",
      reason: "AWS_REGION environment variable not set",
    });
    return null;
  }

  try {
    // Dynamically import AWS SDK to avoid issues if not installed
    const { SecretsManagerClient: SMClient } = await import(
      "@aws-sdk/client-secrets-manager" as string
    );

    secretsManagerClient = new SMClient({ region: awsRegion }) as SecretsManagerClient;

    logger.info("Secrets Manager initialized", {
      event: "secrets_manager_init",
      region: awsRegion,
    });

    return secretsManagerClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Cannot find module") || errorMessage.includes("aws-sdk")) {
      logger.warn("AWS SDK not installed", {
        event: "secrets_manager_skip",
        reason: "@aws-sdk/client-secrets-manager package not found",
        recommendation: "Run: pnpm add @aws-sdk/client-secrets-manager",
      });
    } else {
      logger.error("Secrets Manager initialization failed", {
        event: "secrets_manager_error",
        error: errorMessage,
      });
    }

    return null;
  }
}

/**
 * Fetch a secret from AWS Secrets Manager
 *
 * @param secretName - Name or ARN of the secret
 * @returns Secret value or null if not available
 */
async function fetchSecretFromAWS(secretName: string): Promise<string | null> {
  const client = await initSecretsManager();

  if (!client) {
    return null;
  }

  try {
    const { GetSecretValueCommand } = await import(
      "@aws-sdk/client-secrets-manager" as string
    );

    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    if (response.SecretString) {
      logger.info("Secret fetched successfully", {
        event: "secret_fetch_success",
        secretName: secretName.substring(0, 20) + "...", // Truncate for logs
      });
      return response.SecretString;
    }

    logger.warn("Secret has no string value", {
      event: "secret_fetch_empty",
      secretName,
    });
    return null;
  } catch (error) {
    logger.error("Failed to fetch secret", {
      event: "secret_fetch_error",
      secretName: secretName.substring(0, 20) + "...",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Get a secret value with caching
 *
 * @param secretName - AWS Secrets Manager secret name
 * @param envFallback - Environment variable name for fallback
 * @returns Secret value
 * @throws Error if secret not available in production
 */
export async function getSecret(
  secretName: string,
  envFallback: string
): Promise<string> {
  // Check cache first
  const cached = secretsCache.get(secretName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Try AWS Secrets Manager
  const awsSecret = await fetchSecretFromAWS(secretName);
  if (awsSecret) {
    // Parse JSON if the secret is stored as JSON
    let secretValue = awsSecret;
    try {
      const parsed = JSON.parse(awsSecret);
      // If it's a JSON object, look for common key names
      if (typeof parsed === "object" && parsed !== null) {
        secretValue = parsed.value || parsed.secret || parsed.privateKey || parsed.key || awsSecret;
      }
    } catch {
      // Not JSON, use as-is
    }

    // Cache the result
    secretsCache.set(secretName, {
      value: secretValue,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return secretValue;
  }

  // Fall back to environment variable
  const envValue = process.env[envFallback];

  if (envValue) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("Using environment variable fallback in production", {
        event: "secret_env_fallback",
        warning: `${envFallback} loaded from environment - consider using Secrets Manager`,
        envVar: envFallback,
      });
    }
    return envValue;
  }

  // No value available
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `FATAL: Secret '${secretName}' not available. ` +
        `Configure AWS Secrets Manager or set ${envFallback} environment variable.`
    );
  }

  throw new Error(
    `Secret '${secretName}' not configured. Set ${envFallback} environment variable for development.`
  );
}

/**
 * Get the relayer private key
 * This is the most security-critical secret in the system
 *
 * @returns Relayer private key (hex string with 0x prefix)
 */
export async function getRelayerPrivateKey(): Promise<`0x${string}`> {
  const secretName =
    process.env.RELAYER_PRIVATE_KEY_SECRET_NAME || "vlossom/relayer-private-key";

  const key = await getSecret(secretName, "RELAYER_PRIVATE_KEY");

  // Ensure proper format
  if (!key.startsWith("0x")) {
    return `0x${key}` as `0x${string}`;
  }

  return key as `0x${string}`;
}

/**
 * Clear the secrets cache
 * Useful for testing or forced refresh
 */
export function clearSecretsCache(): void {
  secretsCache.clear();
  logger.info("Secrets cache cleared", { event: "secrets_cache_clear" });
}

/**
 * Check if Secrets Manager is available
 */
export async function isSecretsManagerAvailable(): Promise<boolean> {
  const client = await initSecretsManager();
  return client !== null;
}
