// src/services/apiClient.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://intelimerch-api-production.up.railway.app/api/v1';

// ── Token management ──
export const getToken = () => localStorage.getItem('accessToken');
export const setToken = (token) => localStorage.setItem('accessToken', token);
export const clearToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// Endpoints where a 401 means "bad credentials", not "your session expired".
const AUTH_ENTRY_ENDPOINTS = [
  '/auth/login',
  '/auth/register-artist',
  '/auth/register-internal-team',
  '/taps', // ✅ CORRECT: Use /taps (matches actual backend mounting)
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

    if (response.status === 401 && !isAuthEntryEndpoint(endpoint)) {
      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      const message = data.message || '';

      if (
        message.includes('expired') ||
        message.includes('invalid token') ||
        message.includes('session expired') ||
        message.includes('jwt expired') ||
        message.includes('token expired')
      ) {
        clearToken();
        window.location.href = '/signin';
        throw new ApiError('Your session has expired. Please login again.', 401, 'SESSION_EXPIRED');
      }

      throw new ApiError(
        data.message || 'You are not authorized to perform this action.',
        401,
        'UNAUTHORIZED'
      );
    }

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
      throw new ApiError(
        data.message || data.error || 'Request failed. Please try again.',
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
        'Connection timed out. Please check your internet connection and try again.',
        408,
        'TIMEOUT'
      );
    }

    // ─── Handle Network Errors ───
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection.',
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
    const refreshToken = response.refreshToken || null;

    return {
      ...response,
      user,
      accessToken,
      refreshToken,
      accountType: user.accountType || user.role || 'USER',
    };
  },

  getProfile: () => api.get('/auth/me/profile'),
  registerArtist: (data) => api.post('/auth/register-artist', data),
  registerInternalTeam: (data) => api.post('/auth/register-internal-team', data),
  createRole: (data) => api.post('/auth/create-role', data),
  getRoles: () => api.get('/auth/get-roles'),
  logout: () => api.post('/auth/logout'),
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

  create: (artistId, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });
    if (data.file) formData.append('file', data.file);

    return apiRequest(`/admin/${artistId}/create-perk`, {
      method: 'POST',
      body: formData,
    });
  },

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

// ── Campaign APIs (with pagination) ──
export const campaignAPI = {
  create: (data) => api.post('/campaigns', data),
  getAll: (page = 1, limit = 20) => api.get(`/campaigns?page=${page}&limit=${limit}`),
  getById: (campaignId) => api.get(`/campaigns/${campaignId}`),
  update: (campaignId, data) => api.patch(`/campaigns/${campaignId}`, data),
  delete: (campaignId) => api.delete(`/campaigns/${campaignId}`),
  createPage: (campaignId, pageStructure) =>
    api.post(`/campaigns/${campaignId}/pages`, pageStructure),
};

// ── Product APIs (with pagination) ──
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
  getArtistTags: (page = 1, limit = 20) => api.get(`/tags/artist-all-tags?page=${page}&limit=${limit}`),
  getAllForArtist: (page = 1, limit = 20) => api.get(`/tags/artist-all-tags?page=${page}&limit=${limit}`),
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
// NFC TAP / FAN FLOW (ONCE - No duplicates) - Mounted at /taps
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
    try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();

        const location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    resolve({ latitude, longitude, accuracy });
                },
                (error) => {
                    console.error("Location error:", error.message);
                    resolve({ latitude: null, longitude: null, accuracy: null });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });

        return {
            ip,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            country: "Unknown",
            state: "Unknown",
            city: "Unknown"
        };
    } catch (error) {
        console.error("Error getting device info:", error);
        return {
            ip: null,
            latitude: null,
            longitude: null,
            accuracy: null,
            country: "Unknown",
            state: "Unknown",
            city: "Unknown"
        };
    }
}

// ── Tap APIs (MOUNTED AT /taps - MATCHES ACTUAL BACKEND) ──
export const tapAPI = {
  // POST /taps/:tagId/tap  ← CORRECT
  tap: async (tagId, { ownerToken, deviceType, location, ip, latitude, longitude, accuracy } = {}) => {
    return api.post(`/taps/${tagId}/tap`, {
      ...(ownerToken && { ownerToken }),
      deviceType: deviceType || detectDeviceType(),
      ...(location && { location }),
      ip,
      latitude,
      longitude,
      accuracy,
    });
  },

  // POST /taps/nfc/activate  ← CORRECT
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
    ip,
    latitude,
    longitude,
    accuracy,
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
      ip,
      latitude,
      longitude,
      accuracy,
    });
  },

  // GET /taps/nfc/campaign-page-resources  ← CORRECT
  getCampaignResources: ({ tapToken, ownerToken }) => {
    const params = new URLSearchParams({ tapToken, ownerToken });
    return api.get(`/taps/nfc/campaign-page-resources?${params.toString()}`);
  },

  // GET /taps/nfc/campaign-page-resource/:resourceId  ← CORRECT
  getCampaignResource: (resourceId, { tapToken, ownerToken }) => {
    const params = new URLSearchParams({ tapToken, ownerToken });
    return api.get(`/taps/nfc/campaign-page-resource/${resourceId}?${params.toString()}`);
  },
};

export const readTapToken = (response) =>
  response?.tapToken || response?.data?.tapToken || null;

export const readOwnerToken = (response) =>
  response?.ownerToken ||
  response?.data?.ownerToken ||
  response?.data?.owner?.token ||
  null;

export const TAP_OUTCOME = {
  RETURNING: 'returning',
  FRESH: 'fresh',
  CLAIMED: 'claimed',
};

export const readTapOutcome = (response) => {
  const message = (response?.message || '').toLowerCase();
  if (message.includes('welcome back') || message.includes('successful')) {
    return TAP_OUTCOME.RETURNING;
  }
  if (message.includes('activate') || message.includes('fresh')) {
    return TAP_OUTCOME.FRESH;
  }
  return TAP_OUTCOME.FRESH;
};