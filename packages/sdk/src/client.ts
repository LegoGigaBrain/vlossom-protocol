/**
 * Vlossom API Client
 *
 * Main client class for interacting with Vlossom Protocol APIs.
 */

export interface VlossomClientConfig {
  /** Base URL for the API (default: http://localhost:3002/api/v1) */
  baseUrl?: string;
  /** Authentication token (optional, can be set later) */
  token?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in milliseconds (default: 1000) */
  retryDelay?: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export class VlossomApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.name = 'VlossomApiError';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
    this.requestId = error.requestId;
  }
}

/**
 * Core API client with HTTP methods and automatic retry
 */
export class VlossomClient {
  private baseUrl: string;
  private token?: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: VlossomClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3002/api/v1';
    this.token = config.token;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | undefined): void {
    this.token = token;
  }

  /**
   * Get current token
   */
  getToken(): string | undefined {
    return this.token;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...customHeaders,
    });

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    return headers;
  }

  /**
   * Check if an error is retryable (server errors, timeouts, rate limits)
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof VlossomApiError) {
      // Retry on server errors (5xx), timeout (408), and rate limit (429)
      return error.status >= 500 || error.status === 408 || error.status === 429;
    }
    // Retry on network errors
    return error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('network'));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make an HTTP request with automatic retry and exponential backoff
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    customHeaders?: Record<string, string>,
    retriesRemaining: number = this.maxRetries
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.buildHeaders(customHeaders);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const apiError = new VlossomApiError(
          {
            code: data.error?.code || 'UNKNOWN_ERROR',
            message: data.error?.message || 'An error occurred',
            details: data.error?.details,
            requestId: data.requestId,
          },
          response.status
        );

        // Retry if retryable and retries remaining
        if (retriesRemaining > 0 && this.isRetryableError(apiError)) {
          const attempt = this.maxRetries - retriesRemaining + 1;
          const delay = Math.pow(2, attempt - 1) * this.retryDelay; // 1s, 2s, 4s
          await this.sleep(delay);
          return this.request<T>(method, path, body, customHeaders, retriesRemaining - 1);
        }

        throw apiError;
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // If it's already a VlossomApiError, rethrow (already handled above)
      if (error instanceof VlossomApiError) {
        throw error;
      }

      // Convert to VlossomApiError
      let apiError: VlossomApiError;
      if (error instanceof Error && error.name === 'AbortError') {
        apiError = new VlossomApiError(
          { code: 'TIMEOUT', message: 'Request timed out' },
          408
        );
      } else {
        apiError = new VlossomApiError(
          { code: 'NETWORK_ERROR', message: 'Network request failed' },
          0
        );
      }

      // Retry if retryable and retries remaining
      if (retriesRemaining > 0 && this.isRetryableError(apiError)) {
        const attempt = this.maxRetries - retriesRemaining + 1;
        const delay = Math.pow(2, attempt - 1) * this.retryDelay; // 1s, 2s, 4s
        await this.sleep(delay);
        return this.request<T>(method, path, body, customHeaders, retriesRemaining - 1);
      }

      throw apiError;
    }
  }

  // HTTP method shortcuts
  async get<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, headers);
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, headers);
  }

  async put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, headers);
  }

  async patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, headers);
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, headers);
  }
}

export default VlossomClient;
