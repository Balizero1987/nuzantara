import { NextResponse } from "next/server"

const API_URL = process.env.NUZANTARA_API_URL || "https://nuzantara-rag.fly.dev"
const API_KEY = process.env.NUZANTARA_API_KEY || "zantara-secret-2024"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const authHeader = request.headers.get("Authorization")

        console.log("[ImageAPI] Production request")

        const response = await fetch(`${API_URL}/api/v1/image/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": API_KEY,
                "Authorization": authHeader || "",
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error("[ImageAPI] Backend error:", response.status, data)
            return NextResponse.json(
                { error: data.detail || "Image generation failed" },
                { status: response.status }
            )
        }

        return NextResponse.json(data)

    } catch (error) {
        console.error("[ImageAPI] Production error:", error)
        return NextResponse.json(
            { error: "Failed to connect to Image service" },
            { status: 500 }
        )
    }
}
