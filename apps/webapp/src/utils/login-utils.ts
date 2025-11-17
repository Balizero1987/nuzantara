// Utility functions for validation
export const validateEmail = (email: string): boolean => {
  if (email.length === 0) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePin = (pin: string): { isValid: boolean; length: number } => {
  const numericPin = pin.replace(/\D/g, '');
  const length = numericPin.length;
  const isValid = length >= 4 && length <= 8;
  return { isValid, length };
};

export const sanitizePin = (pin: string): string => {
  return pin.replace(/\D/g, '');
};

// Fetch timeout helper
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    throw error;
  }
}

// API response types
interface LoginResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  access_token?: string;
  expires_in?: number;
  ok?: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role?: string;
    };
    token: string;
    expiresIn?: number;
    expires_in?: number;
  };
}

interface ParsedLoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  token: string;
  expiresIn: number;
}

// Parse login response
export const parseLoginResponse = (result: LoginResponse): ParsedLoginResult => {
  let user, token, expiresIn;
  
  // Format 1: Direct format { user, access_token, expires_in }
  if (result.user && result.access_token) {
    user = result.user;
    token = result.access_token;
    expiresIn = result.expires_in || 900;
  }
  // Format 2 & 3: Wrapped formats { ok: true, data: {...} } or { data: {...} }
  else if (result.data) {
    user = result.data.user;
    token = result.data.token;
    expiresIn = result.data.expiresIn || result.data.expires_in || 900;
  }
  else {
    throw new Error('Invalid response format from server');
  }

  return { user, token, expiresIn };
};

// Error message formatter
export const formatErrorMessage = (errorMsg: string): string => {
  if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
    return 'Connection timeout. Please check your internet and try again.';
  } else if (errorMsg.includes('Invalid PIN')) {
    return 'Invalid PIN. Please try again.';
  } else if (errorMsg.includes('User not found')) {
    return 'Email not found. Please check your email.';
  } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
    return 'Connection error. Please check your internet.';
  } else if (errorMsg.includes('Invalid response')) {
    return 'Server error. Please try again later.';
  }
  return errorMsg;
};

// Auth token retrieval
export const getAuthToken = (): string | null => {
  try {
    const tokenData = localStorage.getItem('zantara-token');
    if (!tokenData) return null;

    const parsed = JSON.parse(tokenData);

    // Check if token is expired
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      // Token expired, clear it
      localStorage.removeItem('zantara-token');
      localStorage.removeItem('zantara-user');
      localStorage.removeItem('zantara-session');
      return null;
    }

    return parsed.token || null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

// Get user data from localStorage
export const getAuthUser = (): { id: string; email: string; name: string; role?: string } | null => {
  try {
    const userData = localStorage.getItem('zantara-user');
    if (!userData) return null;

    return JSON.parse(userData);
  } catch (error) {
    console.error('Error retrieving auth user:', error);
    return null;
  }
};

