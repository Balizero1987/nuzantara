import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient } from '@/lib/api/client';
import { authAPI } from '@/lib/api/auth';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '@/lib/constants';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

jest.mock('@/lib/api/client', () => ({
    apiClient: {
        setToken: jest.fn(),
        clearToken: jest.fn(),
    },
}));

jest.mock('@/lib/api/auth', () => ({
    authAPI: {
        login: jest.fn(),
        clearUser: jest.fn(),
    },
}));

describe('AuthContext', () => {
    const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        avatar: null
    };

    const mockToken = 'test-token';

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('initializes with no user', () => {
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBeFalsy();
    });

    it('initializes from localStorage', () => {
        localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));

        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        expect(result.current.token).toBe(mockToken);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBeTruthy();
        expect(apiClient.setToken).toHaveBeenCalledWith(mockToken);
    });

    it('login updates state and localStorage', async () => {
        (authAPI.login as jest.Mock).mockResolvedValue({
            user: mockUser,
            token: mockToken,
            expiresIn: 3600
        });

        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        await act(async () => {
            await result.current.login({ email: 'test@example.com', pin: '1234' });
        });

        expect(result.current.token).toBe(mockToken);
        expect(result.current.user).toEqual(mockUser);
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(mockToken);
        expect(localStorage.getItem(USER_DATA_KEY)).toBe(JSON.stringify(mockUser));
        expect(apiClient.setToken).toHaveBeenCalledWith(mockToken);
    });

    it('logout clears state and localStorage', async () => {
        // Setup initial state
        localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
        const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

        act(() => {
            result.current.logout();
        });

        expect(result.current.token).toBeNull();
        expect(result.current.user).toBeNull();
        expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
        expect(apiClient.clearToken).toHaveBeenCalled();
        expect(authAPI.clearUser).toHaveBeenCalled();
    });
});
