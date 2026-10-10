// src/services/apiClient.js

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://intelimerch.up.railway.app/api/v1';

// ── Token management ──
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (token) => localStorage.setItem('accessToken', token);

export const clearToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// Endpoints where a 401 means "this is a fan / entry endpoint" — never redirect
// to /signin, always surface a friendly message.
const AUTH_ENTRY_ENDPOINTS = [
  '/auth/login',
  '/auth/register-artist',
  '/auth/register-internal-team',
  '/taps',
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

// ── Detect a genuinely expired session (not a generic 401) ──
function isExpiredSessionMessage(message = '') {
  const m = String(message).toLowerCase();
  return (
    m.includes('jwt expired') ||
    m.includes('token expired') ||
    m.includes('session expired') ||
    m.includes('invalid or expired token')
  );
}

// ── Generic API request ──
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ── TEMP: log every tap request/response ──
if (endpoint.includes('/tap')) {
  try {
    const clone = response.clone();
    const body = await clone.text();
    console.log('[apiClient][tap] request:', {
      endpoint,
      body: options.body,
      sentOwnerToken: (() => {
        try { return JSON.parse(options.body || '{}').ownerToken; } catch { return null; }
      })(),
    });
    console.log('[apiClient][tap] response:', {
      status: response.status,
      body,
    });
  } catch (e) {
    console.warn('diagnostic log failed', e);
  }
}

    // ── 401 handling ──
    if (response.status === 401) {
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      const message = data.message || '';
      const isExpired = isExpiredSessionMessage(message);
      const isFanEndpoint = isAuthEntryEndpoint(endpoint);

      // ── Fan endpoints: never redirect, always friendly ──
      if (isFanEndpoint) {
        if (isExpired) {
          throw new ApiError(
            'Your tap session has ended. Tap your merch again to continue.',
            401,
            'FAN_SESSION_EXPIRED'
          );
        }
        throw new ApiError(
          message || "We couldn't verify this tap. Tap your merch again to continue.",
          401,
          'FAN_UNAUTHORIZED'
        );
      }

      // ── Artist endpoints: genuine expiry → log out ──
      if (isExpired) {
        clearToken();
        window.location.href = '/signin';
        throw new ApiError(
          'Your session has expired. Please login again.',
          401,
          'SESSION_EXPIRED'
        );
      }

      // ── Any other 401 → surface it, do NOT log out ──
      throw new ApiError(
        message || 'You are not authorized to perform this action.',
        401,
        'UNAUTHORIZED'
      );
    }

    // ── Parse body ──
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new ApiError(
          'We are having trouble connecting to the server. Please try again.',
          response.status,
          'SERVER_ERROR'
        );
      }
      data = { message: text };
    }

    if (!response.ok) {
      const apiError = new ApiError(
        data.message || data.error || 'Request failed. Please try again.',
        response.status,
        data.code
      );

      // Preserve context the backend sends for illegal taps
      if (data.ownerFirstName) apiError.ownerFirstName = data.ownerFirstName;
      if (data.socials) apiError.socials = data.socials;

      throw apiError;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(
        'The request took too long. Please try again.',
        408,
        'TIMEOUT'
      );
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('[apiClient] fetch failed:', {
        endpoint,
        method: options.method || 'GET',
        online: navigator.onLine,
        error: error.message,
      });

      throw new ApiError(
        "We couldn't reach the server. Please try again in a moment.",
        0,
        'NETWORK_ERROR'
      );
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'Something went wrong. Please try again.',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

// ── HTTP methods ──
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: (endpoint, body) =>
    apiRequest(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

// ── Auth APIs ──
export const authAPI = {
  login: async (identifier, password) => {
    const trimmed = (identifier || '').trim();
    const isEmail = trimmed.includes('@');
    const payload = isEmail
      ? { email: trimmed, password }
      : { phone: trimmed, password };

    const response = await api.post('/auth/login', payload);
    const user = response.data || response.user || response;
    const accessToken = response.accessToken || response.token;

    if (accessToken) setToken(accessToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    return {
      ...response,
      user,
      accessToken,
      accountType: user.accountType || user.role || 'USER',
    };
  },

  getProfile: () => api.get('/auth/me/profile'),
  registerArtist: (data) => api.post('/auth/register-artist', data),
  registerInternalTeam: (data) => api.post('/auth/register-internal-team', data),
  createRole: (data) => api.post('/auth/create-role', data),
  getRoles: () => api.get('/auth/get-roles'),
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearToken();
    }
  },
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// ── Admin APIs ──
export const adminAPI = {
  registerStaff: (data) => api.post('/admin/register-staff', data),
  registerCreator: (data) => api.post('/admin/register-creator', data),

  getCreators: () => api.get('/admin/creators'),
  getCreatorFans: (artistId) => api.get(`/admin/fans/${artistId}`),
  deleteCreator: (creatorId) => api.delete(`/admin/creators/${creatorId}`),

  createPerkCategory: (data) => api.post('/admin/create-perk-category', data),
  getPerkCategories: () => api.get('/admin/get-perks-categories'),

  createCampaign: (artistId, data) => api.post(`/admin/${artistId}/create-campaign`, data),
  getAllCampaigns: () => api.get('/admin/campaigns'),
  getCampaignById: (campaignId) => api.get(`/admin/campaigns/${campaignId}`),
  updateCampaign: (campaignId, data) => api.patch(`/admin/campaigns/${campaignId}`, data),
  deleteCampaign: (campaignId) => api.delete(`/admin/campaigns/${campaignId}`),

  createProduct: (artistId, data) => api.post(`/admin/${artistId}/create-product`, data),
  getAllProducts: () => api.get('/admin/products'),
  updateProduct: (productId, data) => api.patch(`/admin/products/${productId}`, data),
  deleteProduct: (productId) => api.delete(`/admin/products/${productId}`),

  getAllTags: () => api.get('/admin/tags'),
  createTag: (data) => api.post('/admin/tags', data),
  updateTag: (tagId, data) => api.patch(`/admin/tags/${tagId}`, data),
  deleteTag: (tagId) => api.delete(`/admin/tags/${tagId}`),

  createPerk: (artistId, data) => api.post(`/admin/${artistId}/create-perk`, data),
  getAllPerks: () => api.get('/admin/perks'),

  assignProductToCampaign: (artistId, data) =>
    api.post(`/admin/${artistId}/assign-product-to-campaign`, data),
};

// ── Perks APIs ──
export const perksAPI = {
  getCategories: () => api.get('/admin/get-perks-categories'),
  createCategory: (data) => api.post('/admin/create-perk-category', data),
  create: (data) => api.post('/perks', data),
  getAll: () => api.get('/perks'),
  update: (perkId, fields = {}, file = null) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    if (file) formData.append('file', file);
    if (fields.file) formData.append('file', fields.file);

    return apiRequest(`/perks/${perkId}`, {
      method: 'PATCH',
      body: formData,
    });
  },
  updateJson: (perkId, fields = {}) => api.patch(`/perks/${perkId}`, fields),
  remove: (perkId) => api.delete(`/perks/${perkId}`),
};

// ── Campaign APIs ──
export const campaignAPI = {
  create: (data) => api.post('/campaigns', data),
  getAll: (page = 1, limit = 20) => api.get(`/campaigns?page=${page}&limit=${limit}`),
  getById: (campaignId) => api.get(`/campaigns/${campaignId}`),
  update: (campaignId, data) => api.patch(`/campaigns/${campaignId}`, data),
  delete: (campaignId) => api.delete(`/campaigns/${campaignId}`),
  createPage: (campaignId, pageStructure) =>
    api.post(`/campaigns/${campaignId}/pages`, pageStructure),
};

// ── Product APIs ──
export const productAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/products?page=${page}&limit=${limit}`),
  create: (data) => api.post('/products', data),
  update: (productId, data) => api.patch(`/products/${productId}`, data),
  delete: (productId) => api.delete(`/products/${productId}`),
  assignToCampaign: (productId, data) =>
    api.post(`/products/${productId}/assign-to-campaign`, data),
  checkCampaignProduct: (productId, campaignId) =>
    api.get(`/products/campaign-products/${productId}/${campaignId}`),
};

// ── Tiers APIs ──
export const tiersAPI = {
  getAll: () => api.get('/tiers'),
};

// ── Tags APIs ──
export const tagsAPI = {
  getAll: (page = 1, limit = 20) => api.get(`/tags?page=${page}&limit=${limit}`),
  getByCampaign: (campaignId) => api.get(`/tags/${campaignId}`),
  getArtistTags: (page = 1, limit = 20) =>
    api.get(`/tags/artist-all-tags?page=${page}&limit=${limit}`),
  getAllForArtist: (page = 1, limit = 20) =>
    api.get(`/tags/artist-all-tags?page=${page}&limit=${limit}`),
  create: (data) => api.post('/tags', data),
  update: (tagId, data) => api.patch(`/tags/${tagId}`, data),
  remove: (tagId) => api.delete(`/tags/${tagId}`),
};

// ── Analytics APIs ──
export const analyticsAPI = {
  getDashboardAnalytics: () => api.get('/dashboard/analytics'),
  getCampaignAnalytics: (campaignId) =>
    api.get(`/campaigns/analytics/${campaignId}`),
};

// ══════════════════════════════════════════════════════════════════
// NFC TAP / FAN FLOW - Mounted at /taps
// ══════════════════════════════════════════════════════════════════

export const getOwnerToken = () => localStorage.getItem('ownerToken');
export const setOwnerToken = (token) => localStorage.setItem('ownerToken', token);

export const getTapToken = () => sessionStorage.getItem('tapToken');
export const setTapToken = (token) => sessionStorage.setItem('tapToken', token);

export const clearFanTokens = () => {
  localStorage.removeItem('ownerToken');
  sessionStorage.removeItem('tapToken');
};

export const detectDeviceType = () => {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'web';
};

// ── Device Info Helper ──
export async function getDeviceInfo() {
  let ip = null;
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const json = await ipResponse.json();
    ip = json.ip;
  } catch (err) {
    console.warn('IP lookup failed (non-fatal):', err.message);
  }

  const location = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        console.error('Location error:', error.message);
        resolve({ latitude: null, longitude: null, accuracy: null });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });

  return {
    ip,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    country: 'Unknown',
    state: 'Unknown',
    city: 'Unknown',
  };
}

// ── Tap outcome constants ──
export const TAP_OUTCOME = {
  RETURNING: 'returning',
  FRESH: 'fresh',
  CLAIMED: 'claimed',
};

// ── Tap APIs ──
export const tapAPI = {
  tap: async (tagId, { ownerToken, deviceType, location } = {}) => {
    return api.post(`/taps/${tagId}/tap`, {
      ...(ownerToken && { ownerToken }),
      deviceType: deviceType || detectDeviceType(),
      ...(location && { location }),
    });
  },

  activate: async ({
    tapToken,
    ownerToken,
    firstName,
    lastName,
    email,
    phone,
    consentGiven,
    deviceType,
    location,
  }) => {
    return api.post('/taps/nfc/activate', {
      tapToken,
      ...(ownerToken && { ownerToken }),
      firstName,
      ...(lastName ? { lastName } : {}),
      email,
      phone,
      consentGiven,
      deviceType: deviceType || detectDeviceType(),
      ...(location && { location }),
    });
  },

  getCampaignResources: ({ tapToken, ownerToken }) => {
    const params = new URLSearchParams({ tapToken });
    if (ownerToken) params.append('ownerToken', ownerToken);
    return api.get(`/taps/nfc/campaign-page-resources?${params.toString()}`);
  },

  getCampaignResource: (resourceId, { tapToken, ownerToken }) => {
    const params = new URLSearchParams({ tapToken, ownerToken });
    return api.get(`/taps/nfc/campaign-page-resource/${resourceId}?${params.toString()}`);
  },
};

// ── Read tap outcome from response ──
export const readTapOutcome = (response) => {
  const explicitOutcome = (
    response?.outcome ||
    response?.data?.outcome ||
    ''
  ).toLowerCase();

  if (
    explicitOutcome === TAP_OUTCOME.CLAIMED ||
    explicitOutcome === TAP_OUTCOME.RETURNING ||
    explicitOutcome === TAP_OUTCOME.FRESH
  ) {
    return explicitOutcome;
  }

  const message = (response?.message || '').toLowerCase();

  if (message.includes('claimed') || message.includes('belongs to another')) {
    return TAP_OUTCOME.CLAIMED;
  }
  if (message.includes('welcome back') || message.includes('successful')) {
    return TAP_OUTCOME.RETURNING;
  }
  if (message.includes('activate') || message.includes('fresh')) {
    return TAP_OUTCOME.FRESH;
  }

  return TAP_OUTCOME.FRESH;
};

// ── Read tokens from response ──
export const readTapToken = (response) =>
  response?.tapToken ||
  response?.data?.tapToken ||
  response?.tokens?.tapToken ||
  response?.data?.tokens?.tapToken ||
  null;

export const readOwnerToken = (response) =>
  response?.ownerToken ||
  response?.data?.ownerToken ||
  response?.tokens?.ownerToken ||
  response?.data?.tokens?.ownerToken ||
  null;
