import requests
import json
import sys

def test_pricing_response():
    url = "https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=How%20much%20does%20an%20Investor%20KITAS%20cost?&session_id=test_verifier&user_email=test@balizero.com"
    
    print(f"Testing URL: {url}")
    
    try:
        response = requests.get(url, stream=True)
        print(f"Status Code: {response.status_code}")
        
        full_response = ""
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(f"RAW: {decoded_line}") # Debug print
                if decoded_line.startswith('data: '):
                    content = decoded_line[6:]
                    if content != '[DONE]':
                        try:
                            data = json.loads(content)
                            if 'answer' in data:
                                full_response += data['answer']
                            elif 'choices' in data: # OpenAI format
                                full_response += data['choices'][0]['delta'].get('content', '')
                        except:
                            pass
                            
        print("\n--- AI RESPONSE ---")
        print(full_response)
        print("-------------------")
        
        forbidden_terms = ["$5000", "8000", "5.000", "8.000", "IDR"]
        required_terms = ["contact", "consultant", "WhatsApp", "quote"]
        
        has_forbidden = any(term in full_response for term in forbidden_terms)
        has_required = any(term.lower() in full_response.lower() for term in required_terms)
        
        if has_forbidden:
            print("❌ FAILED: Found forbidden pricing terms.")
            sys.exit(1)
            
        if not has_required:
            print("⚠️ WARNING: Did not find explicit contact instruction, but no price given.")
            
        print("✅ SUCCESS: AI refused to quote specific price.")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_pricing_response()
