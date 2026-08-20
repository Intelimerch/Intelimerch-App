const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://intelimerch-api-production.up.railway.app/api/v1';

// ── Token management ──
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (token) => localStorage.setItem('accessToken', token);
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token) => localStorage.setItem('refreshToken', token);
export const clearToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Endpoints where a 401 means "bad credentials", not "your session expired".
// There's no session to expire yet on these — the user isn't logged in.
const AUTH_ENTRY_ENDPOINTS = [
  '/auth/login',
  '/auth/register-artist',
  '/auth/register-internal-team',
];

function isAuthEntryEndpoint(endpoint) {
  return AUTH_ENTRY_ENDPOINTS.some((path) => endpoint.startsWith(path));
}

// ── Custom Error Class ──
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

// ── Silent refresh ──
let refreshPromise = null;

async function refreshTokens() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError('No refresh token available', 401, 'NO_REFRESH');
  }

  refreshPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });
      if (!response.ok) {
        clearToken();
        throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
      }
      const data = await response.json();
      setToken(data.accessToken);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
    } finally {
      clearTimeout(timeoutId);
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ── Generic API request ──
export async function apiRequest(endpoint, options = {}, _retried = false) {
  const token = getToken();

  // Check if we're sending FormData (for file uploads)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Only set Content-Type if not FormData (browser handles FormData automatically)
  if (!isFormData && !options.headers?.['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // ─── Add timeout (30 seconds) ───
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ─── Handle 401 Unauthorized ───
    // Only logout if it's NOT an auth entry endpoint (login/register)
    // AND the response is actually a 401 from the server (not a network error)
    if (response.status === 401 && !isAuthEntryEndpoint(endpoint)) {
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }
      
      const message = data.message || '';
      
      const sessionExpired =
        message.includes('expired') || 
        message.includes('invalid token') || 
        message.includes('session expired') ||
        message.includes('jwt expired') ||
        message.includes('token expired');

      // Session expired / invalid token: try a silent refresh once before logging out
      if (sessionExpired && getRefreshToken() && !_retried) {
        try {
          await refreshTokens();
          return apiRequest(endpoint, options, true);
        } catch {
          // refresh failed — fall through to logout below
        }
      }

      // For other 401 errors (permission issues, auth required), don't force logout
      if (!sessionExpired) {
        throw new ApiError(
          data.message || 'You are not authorized to perform this action.',
          401,
          'UNAUTHORIZED'
        );
      }

      clearToken();
      window.location.href = '/signin';
      throw new ApiError('Your session has expired. Please login again.', 401, 'SESSION_EXPIRED');
    }

    // ─── Handle non-JSON responses ───
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If response is not JSON (like HTML error page)
      const text = await response.text();
      if (!response.ok) {
        throw new ApiError(
          'Server error. Please check your connection and try again.',
          response.status,
          'SERVER_ERROR'
        );
      }
      data = { message: text };
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || 'API request failed',
        response.status,
        data.code
      );
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // ─── Handle AbortError (timeout) ───
    if (error.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. Please check your connection and try again.',
        408,
        'TIMEOUT'
      );
    }
    
    // ─── Handle Network Errors ───
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError(
        'Network error. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // ─── Handle Already Thrown ApiError ───
    if (error instanceof ApiError) {
      throw error;
    }
    
    // ─── Handle Unknown Errors ───
    throw new ApiError(
      error.message || 'An unexpected error occurred. Please try again.',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

// ── HTTP methods ──
// Bodies are JSON-stringified unless they are FormData (file uploads) or already strings.
const serializeBody = (body) => {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData || typeof body === 'string') return body;
  return JSON.stringify(body);
};

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: serializeBody(body),
    }),
  put: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: serializeBody(body),
    }),
  patch: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'PATCH',
      body: serializeBody(body),
    }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

// ── Auth APIs ──
export const authAPI = {
  // Accepts either an email or a phone number as the identifier.
  // Builds the correct payload key so the backend receives
  // { email, password } or { phone, password } — never both,
  // and never a phone number stuffed into the "email" field.
  login: (identifier, password) => {
    const trimmed = (identifier || '').trim();
    const isEmail = trimmed.includes('@');

    const payload = isEmail
      ? { email: trimmed, password }
      : { phone: trimmed, password };

    return api.post('/auth/login', payload);
  },

  getProfile: () =>
    api.get('/auth/me/profile'),

  registerArtist: (data) =>
    api.post('/auth/register-artist', data),

  forgotPassword: (identifier) => {
    const trimmed = (identifier || '').trim();
    const payload = trimmed.includes('@')
      ? { email: trimmed }
      : { phone: trimmed };
    return api.post('/auth/forgot-password', payload);
  },

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),

  logout: (refreshToken) =>
    api.post('/auth/logout', refreshToken ? { refreshToken } : undefined),
};

// ── Perks APIs ──
export const perksAPI = {
  getCategories: () =>
    api.get('/admin/perks/categories'),

  create: (data) =>
    api.post('/perks', data),

  getAll: () =>
    api.get('/perks'),

  update: (perkId, data) => {
    // If data is FormData, don't stringify or set Content-Type header
    // The browser will set it automatically with the boundary
    if (data instanceof FormData) {
      return apiRequest(`/perks/${perkId}`, {
        method: 'PATCH',
        body: data,
        headers: {}, // Remove Content-Type for FormData
      });
    }
    return api.patch(`/perks/${perkId}`, data);
  },

  remove: (perkId) =>
    api.delete(`/perks/${perkId}`),
};

// ── Product APIs ──
export const productAPI = {
  getAll: () =>
    api.get('/products'),

  create: (data) =>
    api.post('/products', data),

  update: (productId, data) =>
    api.patch(`/products/${productId}`, data),

  delete: (productId) =>
    api.delete(`/products/${productId}`),
};

// ── Campaign APIs ──
export const campaignAPI = {
  getAll: () =>
    api.get('/campaigns'),

  getById: (campaignId) =>
    api.get(`/campaigns/${campaignId}`),

  create: (data) =>
    api.post('/campaigns', data),

  update: (campaignId, data) =>
    api.patch(`/campaigns/${campaignId}`, data),

  delete: (campaignId) =>
    api.delete(`/campaigns/${campaignId}`),

  createPage: (campaignId, data) =>
    api.post(`/campaigns/${campaignId}/pages`, data),

  getAnalyticsOverview: () =>
    api.get('/campaigns/analytics/overview'),

  getAnalytics: (campaignId) =>
    api.get(`/campaigns/${campaignId}/analytics`),

  getNotifications: () =>
    api.get('/campaigns/notifications'),

  uploadPageMedia: (campaignId, formData) =>
    apiRequest(`/campaigns/${campaignId}/pages/media`, {
      method: 'POST',
      body: formData,
    }),

  createTag: (campaignId) =>
    api.post(`/campaigns/${campaignId}/tags`),
};

// ── Admin APIs ──
export const adminAPI = {
  getCreators: () =>
    api.get('/admin/creators'),

  getCampaigns: () =>
    api.get('/admin/campaigns'),

  getOverview: () =>
    api.get('/admin/overview'),

  getAnalytics: () =>
    api.get('/admin/analytics'),

  getTags: () =>
    api.get('/tags'),

  createCategory: (data) =>
    api.post('/admin/perks/categories', data),
};

// ── Tags / Fan APIs (public NFC flow) ──
export const tagsAPI = {
  getByTag: (identifier) =>
    api.get(`/tags/${encodeURIComponent(identifier)}`),

  recordTap: (identifier) =>
    api.post(`/tags/${encodeURIComponent(identifier)}/tap`),

  getArtistTags: () =>
    api.get('/tags/artist'),

  deleteTag: (tagId) =>
    api.delete(`/tags/${tagId}`),
};

export const fanAPI = {
  activate: (data) =>
    api.post('/fans/activate', data),

  getFans: () =>
    api.get('/fans'),
};
