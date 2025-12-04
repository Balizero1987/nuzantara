#!/usr/bin/env python3
"""
Generate JWT token for testing
"""
import sys
from datetime import datetime, timedelta, timezone
from jose import jwt

JWT_SECRET = "07XoX6Eu24amEuUye7MhTFO62jzaYJ48myn04DvECN0="
JWT_ALGORITHM = "HS256"


def generate_token(user_id="test_user", email="test@balizero.com", role="user"):
    """Generate JWT token for testing"""
    expiration = datetime.now(timezone.utc) + timedelta(days=7)

    payload = {
        "sub": user_id,
        "userId": user_id,
        "email": email,
        "role": role,
        "department": "test",
        "sessionId": f"test_session_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "exp": int(expiration.timestamp()),
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else "test_user"
    email = sys.argv[2] if len(sys.argv) > 2 else "test@balizero.com"

    token = generate_token(user_id, email)
    print(token)
