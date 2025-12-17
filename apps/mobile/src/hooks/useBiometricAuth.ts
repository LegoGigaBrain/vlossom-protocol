/**
 * Biometric Authentication Hook (V6.0)
 *
 * Provides Face ID / Touch ID authentication for secure access
 * Falls back to device passcode if biometrics unavailable
 */

import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// =============================================================================
// Types
// =============================================================================

export interface BiometricAuthState {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseBiometricAuthReturn extends BiometricAuthState {
  authenticate: (options?: AuthenticateOptions) => Promise<boolean>;
  checkBiometricAvailability: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: boolean;
}

interface AuthenticateOptions {
  promptMessage?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const BIOMETRIC_ENABLED_KEY = 'vlossom_biometric_enabled';

// =============================================================================
// Hook
// =============================================================================

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnrolled: false,
    biometricType: 'none',
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  /**
   * Load user's biometric preference from secure storage
   */
  const loadBiometricPreference = async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Failed to load biometric preference:', error);
    }
  };

  /**
   * Check if biometric authentication is available and enrolled
   */
  const checkBiometricAvailability = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Check hardware availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setState((prev) => ({
          ...prev,
          isAvailable: false,
          isLoading: false,
        }));
        return;
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometricType: BiometricAuthState['biometricType'] = 'none';

      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'facial';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      setState((prev) => ({
        ...prev,
        isAvailable: hasHardware,
        isEnrolled,
        biometricType,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check biometric availability',
      }));
    }
  }, []);

  /**
   * Authenticate user with biometrics
   */
  const authenticate = useCallback(
    async (options?: AuthenticateOptions): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: options?.promptMessage || 'Authenticate to continue',
          fallbackLabel: options?.fallbackLabel || 'Use passcode',
          cancelLabel: options?.cancelLabel || 'Cancel',
          disableDeviceFallback: options?.disableDeviceFallback || false,
        });

        if (result.success) {
          setState((prev) => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
          }));
          return true;
        }

        // Handle error cases
        let errorMessage = 'Authentication failed';
        if (result.error === 'user_cancel') {
          errorMessage = 'Authentication cancelled';
        } else if (result.error === 'user_fallback') {
          errorMessage = 'Please use passcode';
        } else if (result.error === 'lockout') {
          errorMessage = 'Too many attempts. Please try again later.';
        }

        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication error',
        }));
        return false;
      }
    },
    []
  );

  /**
   * Enable biometric authentication for the app
   */
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // First authenticate to confirm user identity
      const authenticated = await authenticate({
        promptMessage: 'Confirm your identity to enable biometric login',
      });

      if (authenticated) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        setIsBiometricEnabled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  }, [authenticate]);

  /**
   * Disable biometric authentication for the app
   */
  const disableBiometric = useCallback(async (): Promise<void> => {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Failed to disable biometric:', error);
    }
  }, []);

  return {
    ...state,
    authenticate,
    checkBiometricAvailability,
    enableBiometric,
    disableBiometric,
    isBiometricEnabled,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get human-readable biometric type name
 */
export function getBiometricTypeName(type: BiometricAuthState['biometricType']): string {
  switch (type) {
    case 'facial':
      return 'Face ID';
    case 'fingerprint':
      return 'Touch ID';
    case 'iris':
      return 'Iris Scan';
    default:
      return 'Biometric';
  }
}
