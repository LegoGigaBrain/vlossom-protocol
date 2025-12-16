/**
 * Auth Module
 *
 * Authentication functions for Vlossom SDK.
 */

import { VlossomClient, type ApiResponse } from './client';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  roles: string[];
  verificationStatus: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface SignupParams {
  email: string;
  password: string;
  displayName: string;
  role: 'CUSTOMER' | 'STYLIST';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthModule {
  /** Log in with email and password */
  login(params: LoginParams): Promise<AuthResponse>;
  /** Create a new account */
  signup(params: SignupParams): Promise<AuthResponse>;
  /** Log out and clear token */
  logout(): Promise<void>;
  /** Get current authenticated user */
  getCurrentUser(): Promise<User>;
  /** Check if currently authenticated */
  isAuthenticated(): boolean;
}

/**
 * Create auth module bound to a client instance
 */
export function createAuthModule(client: VlossomClient): AuthModule {
  return {
    async login(params: LoginParams): Promise<AuthResponse> {
      const response = await client.post<AuthResponse>('/auth/login', params);
      client.setToken(response.data.token);
      return response.data;
    },

    async signup(params: SignupParams): Promise<AuthResponse> {
      const response = await client.post<AuthResponse>('/auth/signup', params);
      client.setToken(response.data.token);
      return response.data;
    },

    async logout(): Promise<void> {
      if (client.isAuthenticated()) {
        try {
          await client.post('/auth/logout');
        } catch {
          // Ignore logout errors
        }
      }
      client.setToken(undefined);
    },

    async getCurrentUser(): Promise<User> {
      const response = await client.get<User>('/auth/me');
      return response.data;
    },

    isAuthenticated(): boolean {
      return client.isAuthenticated();
    },
  };
}
