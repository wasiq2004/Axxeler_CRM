// Base API service for the CRM
class BaseApi {
  private baseUrl: string;
  private token: string | null;
  // Shared in-flight refresh so concurrent 401s trigger only one refresh call.
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
  }

  // Exchange the stored refresh token for a fresh access token. Deduped so that
  // a burst of 401s only fires one /auth/refresh request.
  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    if (!this.refreshPromise) {
      this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then(async (res) => {
          if (!res.ok) return false;
          const body = await res.json().catch(() => null);
          const data = body?.data || body;
          if (!data?.accessToken) return false;
          localStorage.setItem('token', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          this.token = data.accessToken;
          return true;
        })
        .catch(() => false)
        .finally(() => { this.refreshPromise = null; });
    }
    return this.refreshPromise;
  }

  private forceLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.token = null;
    // AuthContext listens for this to clear state and redirect to /login.
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  private async request(endpoint: string, options: RequestInit = {}, _retried = false): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      // Access token likely expired — refresh once and retry the original request.
      if (response.status === 401 && !_retried && !endpoint.startsWith('/auth/')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) return this.request(endpoint, options, true);
        this.forceLogout();
      }

      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.json();
          message = errorBody.error || message;
        } catch {
          // Keep the HTTP status fallback when the response is not JSON.
        }
        throw new Error(message);
      }

      if (response.status === 204) return { success: true };
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async getBlob(endpoint: string): Promise<{ blob: Blob; filename: string }> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'download';
    const blob = await response.blob();
    return { blob, filename };
  }

  postForm(endpoint: string, data: FormData) {
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data,
    }).then(async (response) => {
      if (!response.ok) throw new Error((await response.text()) || `HTTP error! status: ${response.status}`);
      return response.json();
    });
  }
}

export default BaseApi;
