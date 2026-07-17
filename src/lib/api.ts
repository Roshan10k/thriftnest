const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// CSRF token for the double-submit-cookie scheme. The server sets a matching
// `csrfToken` cookie; we fetch the value once, cache it, and echo it in the
// `x-csrf-token` header on every state-changing request. A cross-site attacker
// cannot read this value, so it cannot forge the header.
let csrfToken: string | null = null;
let csrfInflight: Promise<string> | null = null;
async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfInflight) {
    csrfInflight = fetch(`${BASE_URL}/csrf-token`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        csrfToken = (d?.csrfToken as string) ?? '';
        return csrfToken;
      })
      .finally(() => { csrfInflight = null; });
  }
  return csrfInflight;
}

// Auth tokens live in HttpOnly cookies set by the server, so the browser sends
// them automatically with `credentials: 'include'` — the frontend never reads
// or stores them (defends against XSS token theft).
async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (!SAFE_METHODS.has(method)) {
    headers['x-csrf-token'] = await getCsrfToken();
  }
  return fetch(`${BASE_URL}${path}`, {
    cache: 'no-store',
    credentials: 'include',
    ...options,
    headers,
  });
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  // Collapse concurrent refreshes into one in-flight request.
  if (!refreshing) {
    refreshing = rawFetch('/auth/refresh', { method: 'POST' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res = await rawFetch(path, options);

  // On an expired access token, transparently refresh once and retry.
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefresh();
    if (refreshed) res = await rawFetch(path, options);
  }

  // On a stale/missing CSRF token, drop the cache, re-fetch a fresh token, and
  // retry once so the failure self-heals rather than surfacing to the user.
  if (res.status === 403) {
    const probe = await res.clone().json().catch(() => ({}));
    if (typeof probe?.message === 'string' && probe.message.toLowerCase().includes('csrf')) {
      csrfToken = null;
      res = await rawFetch(path, options);
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message ?? 'Request failed', res.status, data.code);
  return data;
}

export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { email: string; password: string; name: string; role: string; phone?: string }) =>
    request<{ data: { user: Record<string, unknown> } }>(
      '/auth/register', { method: 'POST', body: JSON.stringify(body) },
    ),
  login: (body: { email: string; password: string; mfaToken?: string; backupCode?: string }) =>
    request<{ data: { mfaRequired?: true; userId?: string; user?: Record<string, unknown> } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify(body) },
    ),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ data: Record<string, unknown> }>('/auth/me'),
  mfaSetup: () =>
    request<{ data: { secret: string; otpauthUrl: string; qrCodeDataUrl: string } }>(
      '/auth/mfa/setup', { method: 'POST' },
    ),
  mfaConfirm: (secret: string, token: string) =>
    request<{ data: { backupCodes: string[] } }>(
      '/auth/mfa/confirm', { method: 'POST', body: JSON.stringify({ secret, token }) },
    ),
  mfaDisable: (password: string) =>
    request<{ success: boolean }>(
      '/auth/mfa', { method: 'DELETE', body: JSON.stringify({ password }) },
    ),
  setupMfa: () =>
    request<{ data: { secret: string; qrCodeDataUrl: string; backupCodes: string[] } }>(
      '/auth/mfa/setup', { method: 'POST' },
    ),
  confirmMfa: (body: { secret: string; token: string }) =>
    request<{ data: { backupCodes: string[] } }>('/auth/mfa/confirm', { method: 'POST', body: JSON.stringify(body) }),
  disableMfa: (password: string) =>
    request<{ success: boolean }>('/auth/mfa', { method: 'DELETE', body: JSON.stringify({ password }) }),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email: string, otp: string, password: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, password }) }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => request<{ data: Record<string, unknown> }>('/users/me'),
  getById: (id: string) => request<{ data: Record<string, unknown> }>(`/users/${id}`),
  updateMe: (body: Record<string, unknown>) =>
    request<{ data: Record<string, unknown> }>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  updateAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return request<{ data: { avatar: string } }>('/users/me/avatar', { method: 'POST', body: fd });
  },
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>('/users/me/change-password', { method: 'POST', body: JSON.stringify(body) }),
  exportData: () => request<{ data: Record<string, unknown> }>('/users/me/export'),
  deleteAccount: (password: string) =>
    request<{ success: boolean }>('/users/me', { method: 'DELETE', body: JSON.stringify({ password }) }),
};

// ─── Listings ────────────────────────────────────────────────────────────────
export interface ListingQuery {
  page?: number;
  limit?: number;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  sort?: string;
  sellerId?: string;
}

export const listingsApi = {
  browse: (q: ListingQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => v !== undefined && params.set(k, String(v)));
    return request<{ data: { listings: Record<string, unknown>[]; total: number } }>(`/listings?${params}`);
  },
  getById: (id: string) => request<{ data: Record<string, unknown> }>(`/listings/${id}`),
  create: (body: Record<string, unknown>, images: File[]) => {
    const fd = new FormData();
    Object.entries(body).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    images.forEach((f) => fd.append('images', f));
    return request<{ data: Record<string, unknown> }>('/listings', { method: 'POST', body: fd });
  },
  update: (id: string, body: Record<string, unknown>, newImages?: File[]) => {
    const fd = new FormData();
    Object.entries(body).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    (newImages ?? []).forEach((f) => fd.append('images', f));
    return request<{ data: Record<string, unknown> }>(`/listings/${id}`, { method: 'PATCH', body: fd });
  },
  delete: (id: string) => request<{ success: boolean }>(`/listings/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<{ success: boolean }>(`/listings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  mine: (page = 1, limit = 20) =>
    request<{ data: { listings: Record<string, unknown>[]; total: number } }>(`/listings/my?page=${page}&limit=${limit}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (body: Record<string, unknown>) =>
    request<{ data: Record<string, unknown> }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getById: (id: string) => request<{ data: Record<string, unknown> }>(`/orders/${id}`),
  mine: (page = 1, limit = 20) =>
    request<{ data: { orders: Record<string, unknown>[]; total: number } }>(`/orders/my?page=${page}&limit=${limit}`),
  sellerOrders: (page = 1, limit = 20) =>
    request<{ data: { orders: Record<string, unknown>[]; total: number } }>(`/orders/seller?page=${page}&limit=${limit}`),
  updateStatus: (id: string, body: { status: string; trackingNumber?: string; disputeReason?: string }) =>
    request<{ data: Record<string, unknown> }>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (body: { orderId: string; rating: number; comment: string }) =>
    request<{ data: Record<string, unknown> }>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  forListing: (listingId: string, page = 1) =>
    request<{ data: { reviews: Record<string, unknown>[]; total: number } }>(`/reviews/listing/${listingId}?page=${page}`),
  forSeller: (sellerId: string, page = 1) =>
    request<{ data: { reviews: Record<string, unknown>[]; total: number } }>(`/reviews/seller/${sellerId}?page=${page}`),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistApi = {
  get: () => request<{ data: Record<string, unknown>[] }>('/wishlist'),
  add: (listingId: string) =>
    request<{ data: Record<string, unknown> }>(`/wishlist/${listingId}`, { method: 'POST' }),
  remove: (id: string) => request<{ success: boolean }>(`/wishlist/${id}`, { method: 'DELETE' }),
  setPriceAlert: (id: string, enabled: boolean) =>
    request<{ success: boolean }>(`/wishlist/${id}/price-alert`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  get: () => request<{ data: { notifications: Record<string, unknown>[]; unread: number } }>('/notifications'),
  markRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),
  delete: (id: string) => request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),
};

// ─── Messages ────────────────────────────────────────────────────────────────
export const messagesApi = {
  getConversations: () => request<{ data: Record<string, unknown>[] }>('/messages'),
  getOrCreate: (otherUserId: string, listingId?: string) =>
    request<{ data: Record<string, unknown> }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ otherUserId, listingId }),
    }),
  getMessages: (conversationId: string, page = 1) =>
    request<{ data: { messages: Record<string, unknown>[]; total: number } }>(`/messages/${conversationId}/messages?page=${page}`),
  send: (conversationId: string, content: string, type?: string, offerAmount?: number) =>
    request<{ data: Record<string, unknown> }>(`/messages/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type, offerAmount }),
    }),
  respondToOffer: (conversationId: string, messageId: string, action: 'accept' | 'decline' | 'counter', counterAmount?: number) =>
    request<{ data: Record<string, unknown> }>(`/messages/${conversationId}/messages/${messageId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, counterAmount }),
    }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  users: (page = 1, limit = 20) =>
    request<{ data: { users: Record<string, unknown>[]; total: number } }>(`/admin/users?page=${page}&limit=${limit}`),
  listings: (page = 1, limit = 20) =>
    request<{ data: { listings: Record<string, unknown>[]; total: number } }>(`/admin/listings?page=${page}&limit=${limit}`),
  orders: (page = 1, limit = 20) =>
    request<{ data: { orders: Record<string, unknown>[]; total: number } }>(`/admin/orders?page=${page}&limit=${limit}`),
  transactions: (page = 1, limit = 20) =>
    request<{ data: { transactions: Record<string, unknown>[]; total: number } }>(`/admin/transactions?page=${page}&limit=${limit}`),
  logs: (page = 1, limit = 50) =>
    request<{ data: { logs: Record<string, unknown>[]; total: number } }>(`/admin/logs?page=${page}&limit=${limit}`),
  banUser: (id: string) => request<{ success: boolean }>(`/admin/users/${id}/ban`, { method: 'PATCH' }),
  unbanUser: (id: string) => request<{ success: boolean }>(`/admin/users/${id}/unban`, { method: 'PATCH' }),
  deleteUser: (id: string) => request<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
  removeListing: (id: string) => request<{ success: boolean }>(`/admin/listings/${id}/remove`, { method: 'PATCH' }),
  resolveOrder: (id: string) => request<{ success: boolean }>(`/admin/orders/${id}/resolve`, { method: 'PATCH' }),
};

// Backwards-compat named export used by auth pages
export const api = { auth: authApi };
