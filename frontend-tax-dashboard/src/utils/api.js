const API_BASE = '/api/tax';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('tax_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, { message: error.message });
  }
}

// Auth APIs
export const auth = {
  login: async (email, password) => {
    const response = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.ok && response.data.token) {
      localStorage.setItem('tax_token', response.data.token);
      localStorage.setItem('tax_user', JSON.stringify(response.data.user));
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('tax_token');
    localStorage.removeItem('tax_user');
  },

  me: async () => {
    return fetchAPI('/auth/me');
  },

  getUser: () => {
    const userStr = localStorage.getItem('tax_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('tax_token');
  },
};

// Companies APIs
export const companies = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/companies${query ? '?' + query : ''}`);
  },

  get: async (id) => {
    return fetchAPI(`/companies/${id}`);
  },

  create: async (data) => {
    return fetchAPI('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return fetchAPI(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return fetchAPI(`/companies/${id}`, {
      method: 'DELETE',
    });
  },
};

export { ApiError };
