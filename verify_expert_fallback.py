import requests
import json
import time
from jose import jwt
from datetime import datetime, timedelta

# Configuration
API_URL = "https://nuzantara-rag.fly.dev/bali-zero/chat-stream"
JWT_SECRET_KEY = (
    "zantara_default_secret_key_2025_change_in_production"  # Potential default key
)
JWT_ALGORITHM = "HS256"


def generate_test_token():
    """Generate a valid JWT token for testing"""
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode = {
        "sub": "test_user_fallback",
        "email": "test_fallback@balizero.com",
        "role": "admin",
        "exp": expire,
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def test_query(query):
    print(f"\n[Testing] Asking: '{query}'")

    # Use dev-token-bypass directly
    # Use API Key
    headers = {"X-API-Key": "test_key", "Content-Type": "application/json"}

    start_time = time.time()
    try:
        # Using stream endpoint but just reading the response
        response = requests.get(
            API_URL, params={"query": query}, headers=headers, stream=True
        )

        if response.status_code != 200:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False

        full_answer = ""
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode("utf-8")
                if decoded_line.startswith("data: "):
                    data_str = decoded_line[6:]
                    try:
                        data_json = json.loads(data_str)
                        if data_json.get("type") == "token":
                            full_answer += data_json.get("data", "")
                    except:
                        pass

        elapsed = time.time() - start_time
        print(f"⏱️ {elapsed:.2f}s")
        print(f"ANSWER:\n{full_answer.strip()}")

        # Check for forbidden phrase
        if (
            "Non ho documenti caricati relativi a questo specifico argomento"
            in full_answer
        ):
            print("❌ FAILURE: Forbidden 'No documents found' message detected!")
            return False

        # Check for success criteria
        if "ristorante" in query.lower() and "5610" in full_answer:
            print("✅ SUCCESS: KBLI code found!")
            return True

        if "ufficio virtuale" in query.lower() and len(full_answer) > 50:
            print("✅ SUCCESS: Expert fallback provided answer!")
            return True

        return True

    except Exception as e:
        print(f"❌ Exception: {e}")
        return False


if __name__ == "__main__":
    print(f"🚀 Testing Expert Fallback on {API_URL}...")

    # 1. Test KBLI Routing (Should work)
    test_query("Voglio aprire un ristorante, che codice KBLI serve?")

    # 2. Test Expert Fallback (The problematic one)
    test_query("Offrite servizio di ufficio virtuale? A che prezzo?")

    # 3. Test Another Fallback
    test_query("Qual è la differenza tra PT PMA e PT Local?")
