import { NextResponse } from 'next/server';

const API_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';
const API_KEY = process.env.NUZANTARA_API_KEY;

/**
 * Token Refresh Endpoint
 *
 * Attempts to refresh the JWT token by validating the current token
 * and requesting a new one from the backend.
 *
 * Flow:
 * 1. Validate current token with backend /api/auth/check
 * 2. If valid, request token refresh from backend
 * 3. Return new token or error
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Validate current token with backend
    const checkResponse = await fetch(`${API_URL}/api/auth/check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      },
    });

    if (!checkResponse.ok) {
      console.log('[AuthRefresh] Token validation failed:', checkResponse.status);
      return NextResponse.json(
        { error: 'Token is invalid or expired. Please log in again.' },
        { status: 401 }
      );
    }

    const checkData = await checkResponse.json();
    console.log('[AuthRefresh] Token check result:', checkData);

    // Try to get a refreshed token from the backend
    // The backend /api/auth/refresh endpoint should return a new token
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      },
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      if (refreshData.token) {
        console.log('[AuthRefresh] Token refreshed successfully');
        return NextResponse.json({
          token: refreshData.token,
          message: 'Token refreshed successfully',
        });
      }
    }

    // If backend doesn't support refresh, but token is still valid,
    // return the current token (no refresh available)
    // The client should handle this gracefully
    console.log('[AuthRefresh] Backend refresh not available, token still valid');
    return NextResponse.json({
      token: token, // Return same token if still valid
      message: 'Token is still valid',
      refreshed: false,
    });

  } catch (error) {
    console.error('[AuthRefresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
