import axios from 'axios';

/**
 * Falls back to a relative `/api` so the Vite dev proxy works with no .env,
 * and so a production build served from the same origin needs no config.
 */
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Error shape the whole UI can rely on, whatever went wrong. */
export class ApiError extends Error {
  constructor(message, { status, fieldErrors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    /** `{ amount: 'Amount must be greater than 0' }` for form-level display. */
    this.fieldErrors = fieldErrors ?? {};
  }
}

const NETWORK_MESSAGE =
  'Could not reach the server. Check that the API is running and try again.';

/**
 * Normalises every failure into an ApiError. Without this each caller would
 * have to re-derive "is this a network error, a validation error, or a bug?".
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('The request timed out. Please try again.'));
    }
    if (!error.response) {
      return Promise.reject(new ApiError(NETWORK_MESSAGE));
    }

    const { status, data } = error.response;
    const fieldErrors = Object.fromEntries(
      (data?.errors ?? []).map((e) => [e.field, e.message])
    );

    return Promise.reject(
      new ApiError(data?.message || 'Something went wrong. Please try again.', {
        status,
        fieldErrors,
      })
    );
  }
);

/** Unwraps the `{ success, data, meta }` envelope the API always returns. */
export const unwrap = (response) => response.data.data;

/** Unwraps data plus pagination metadata. */
export const unwrapWithMeta = (response) => ({
  items: response.data.data,
  meta: response.data.meta,
});
