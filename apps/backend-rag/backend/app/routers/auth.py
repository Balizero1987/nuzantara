"""
JWT Authentication Router
Real email+PIN authentication using bcrypt and JWT tokens
"""

import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import logging
import os

logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "zantara_default_secret_key_2025_change_in_production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_HOURS", "24"))

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# ============================================================================
# Pydantic Models
# ============================================================================

class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    """Login response model"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class UserProfile(BaseModel):
    """User profile model"""
    id: str
    email: str
    name: str
    role: str
    status: str
    metadata: Optional[Dict[str, Any]] = None
    language_preference: Optional[str] = None

# ============================================================================
# Database Dependencies
# ============================================================================

async def get_db_connection():
    """Get database connection"""
    try:
        import asyncpg
        db_url = os.getenv("DATABASE_URL", "postgres://zantara_rag_user:0FTEr9mMOghmCnk@nuzantara-postgres.flycast:5432/nuzantara_rag?sslmode=disable")
        return await asyncpg.connect(db_url)
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise HTTPException(status_code=503, detail="Database connection failed")

# ============================================================================
# Authentication Functions
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"❌ Password verification failed: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        if user_id is None or email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    # Get user from database
    conn = await get_db_connection()
    try:
        query = """
            SELECT id, email, name, role, status, metadata, language_preference
            FROM users
            WHERE id = $1 AND email = $2 AND status = 'active'
        """
        row = await conn.fetchrow(query, user_id, email)

        if not row:
            raise credentials_exception

        return dict(row)
    finally:
        await conn.close()

# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    User login with email and PIN

    Returns JWT token and user profile on successful authentication
    """
    conn = await get_db_connection()
    try:
        # Real database authentication only
        query = """
            SELECT id, email, name, pin_hash, role, status, metadata, language_preference
            FROM users
            WHERE email = $1 AND status = 'active'
        """
        user = await conn.fetchrow(query, request.email)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or PIN")

        # Verify PIN
        if not verify_password(request.password, user['pin_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or PIN")

        # Update last login
        await conn.execute(
            "UPDATE users SET last_login = NOW() WHERE id = $1",
            user['id']
        )

        # Create JWT token
        access_token_expires = timedelta(hours=JWT_ACCESS_TOKEN_EXPIRE_HOURS)
        access_token = create_access_token(
            data={
                "sub": user['id'],
                "email": user['email'],
                "role": user['role']
            },
            expires_delta=access_token_expires
        )

        # Prepare user profile
        user_profile = {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "role": user['role'],
            "status": user['status'],
            "metadata": user.get('metadata'),
            "language_preference": user.get('language_preference', 'en')
        }

        return LoginResponse(
            success=True,
            message="Login successful",
            data={
                "token": access_token,
                "token_type": "Bearer",
                "expiresIn": JWT_ACCESS_TOKEN_EXPIRE_HOURS * 3600,  # Convert to seconds
                "user": user_profile
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    finally:
        await conn.close()

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(**current_user)

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (server-side token invalidation would go here)"""
    return {"success": True, "message": "Logout successful"}

@router.get("/check")
async def check_auth(current_user: dict = Depends(get_current_user)):
    """Check if current session is valid"""
    return {
        "valid": True,
        "user": {
            "id": current_user['id'],
            "email": current_user['email'],
            "role": current_user['role']
        }
    }

# ============================================================================
# JWT Only Authentication - No Mock Endpoints
# ============================================================================