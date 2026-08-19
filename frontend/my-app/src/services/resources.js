import { apiClient, unwrap, unwrapWithMeta } from './apiClient';

/**
 * Every HTTP call in the app lives here. Components and hooks call these
 * functions; nothing else imports axios.
 */

/** Strips empty filter values so the URL stays clean and cache keys stay stable. */
export const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== null && value !== undefined
    )
  );

const crud = (path) => ({
  list: (params) =>
    apiClient.get(path, { params: cleanParams(params) }).then(unwrapWithMeta),
  get: (id) => apiClient.get(`${path}/${id}`).then(unwrap),
  create: (payload) => apiClient.post(path, payload).then(unwrap),
  update: (id, payload) => apiClient.put(`${path}/${id}`, payload).then(unwrap),
  remove: (id) => apiClient.delete(`${path}/${id}`).then((res) => res.data),
});

export const expensesApi = {
  ...crud('/expenses'),
  /** Returns a Blob so the caller can trigger a download. */
  export: (params, format) =>
    apiClient
      .get('/expenses/export', {
        params: { ...cleanParams(params), format },
        responseType: 'blob',
      })
      .then((res) => res.data),
};

export const incomesApi = crud('/incomes');

export const budgetsApi = {
  list: (month) => apiClient.get('/budgets', { params: cleanParams({ month }) }).then(unwrap),
  save: (payload) => apiClient.put('/budgets', payload).then(unwrap),
  remove: (id) => apiClient.delete(`/budgets/${id}`).then((res) => res.data),
};

export const recurringApi = {
  list: () => apiClient.get('/recurring').then(unwrap),
  create: (payload) => apiClient.post('/recurring', payload).then(unwrap),
  update: (id, payload) => apiClient.put(`/recurring/${id}`, payload).then(unwrap),
  remove: (id) => apiClient.delete(`/recurring/${id}`).then((res) => res.data),
};

export const analyticsApi = {
  dashboard: (params) =>
    apiClient.get('/dashboard', { params: cleanParams(params) }).then(unwrap),
  insights: (params) =>
    apiClient.get('/insights', { params: cleanParams(params) }).then(unwrap),
};

export const authApi = {
  register: (payload) => apiClient.post('/auth/register', payload).then(unwrap),
  login: (payload) => apiClient.post('/auth/login', payload).then(unwrap),
  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
  /** Resolves the current session. 401 here simply means "signed out". */
  me: () => apiClient.get('/auth/me').then(unwrap),
};

export const metaApi = {
  categories: () => apiClient.get('/categories').then(unwrap),
  paymentMethods: () => apiClient.get('/payment-methods').then(unwrap),
  config: () => apiClient.get('/config').then(unwrap),
};
