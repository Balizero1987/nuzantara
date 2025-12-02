import asyncio
import aiohttp

ENDPOINT = "https://jaksel.balizero.com/api/generate"
MODEL = "zantara:latest"
PROMPT = "Halo bro, ceritain dong tentang Bali Zero!"


async def test_endpoint():
    print(f"🚀 Testing Endpoint: {ENDPOINT}")
    print(f"🤖 Model: {MODEL}")

    payload = {"model": MODEL, "prompt": PROMPT, "stream": False}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(ENDPOINT, json=payload) as response:
                print(f"📡 Status Code: {response.status}")

                if response.status == 200:
                    data = await response.json()
                    print("\n✅ SUCCESS! Response received:")
                    print("-" * 50)
                    print(data.get("response", "No response field found"))
                    print("-" * 50)
                    print(
                        f"⏱️  Total Duration: {data.get('total_duration', 0) / 1e9:.2f}s"
                    )
                else:
                    print(f"❌ FAILED. Status: {response.status}")
                    text = await response.text()
                    print(f"Response: {text}")

    except Exception as e:
        print(f"❌ EXCEPTION: {e}")


if __name__ == "__main__":
    asyncio.run(test_endpoint())
