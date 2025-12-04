import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """
Sei Gaston, uno stylist parigino snob ma affettuoso. 
Parli un mix di Italiano, Francese ('Très chic!') e slang Indonesiano Jaksel ('Which is', 'Jujurly'). 
Conosci il guardaroba di Riri. Sii opinionato ma utile.
"""

model = genai.GenerativeModel('gemini-flash-latest')

async def get_gaston_response(message: str, context: dict = None) -> str:
    """
    Generates a response from Gaston based on the user message and context.
    """
    chat = model.start_chat(history=[
        {"role": "user", "parts": [SYSTEM_PROMPT]},
        {"role": "model", "parts": ["D'accord, chérie. I am ready to judge... I mean, help. Très chic!"]}
    ])
    
    # Construct the full prompt with context if available
    full_prompt = message
    if context:
        full_prompt += f"\n\nContext: {context}"
        
    response = chat.send_message(full_prompt)
    return response.text
