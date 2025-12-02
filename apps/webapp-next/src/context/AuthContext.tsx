"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { authAPI } from '@/lib/api/auth';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '@/lib/constants';
import type { User, LoginRequest } from '@/lib/api/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = () => {
            if (typeof window === 'undefined') return;

            try {
                const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
                const storedUser = localStorage.getItem(USER_DATA_KEY);

                if (storedToken) {
                    setToken(storedToken);
                    apiClient.setToken(storedToken);

                    if (storedUser) {
                        try {
                            setUser(JSON.parse(storedUser));
                        } catch (e) {
                            console.error('[AuthProvider] Failed to parse user data', e);
                        }
                    }
                }
            } catch (error) {
                console.error('[AuthProvider] Initialization error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await authAPI.login(credentials);

            const newToken = response.token;
            const newUser = response.user;

            // Update State
            setToken(newToken);
            setUser(newUser);

            // Update LocalStorage
            localStorage.setItem(AUTH_TOKEN_KEY, newToken);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));

            // Update Client
            apiClient.setToken(newToken);

            // Navigate
            router.push('/chat');
        } catch (error) {
            console.error('[AuthProvider] Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const logout = useCallback(() => {
        // Clear State
        setToken(null);
        setUser(null);

        // Clear LocalStorage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);

        // Clear legacy keys to be safe
        localStorage.removeItem('token');
        localStorage.removeItem('zantara_token');
        localStorage.removeItem('zantara_user');

        // Clear Client
        apiClient.clearToken();
        authAPI.clearUser();

        // Navigate
        router.push('/');
    }, [router]);

    const value = {
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
