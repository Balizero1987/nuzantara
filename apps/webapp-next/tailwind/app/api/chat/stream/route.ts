import { NextResponse } from "next/server"

// Mock RAG sources
const MOCK_RAG_SOURCES = [
  {
    source: "visa_requirements_2024.pdf",
    page: 3,
    match_score: 0.95,
    content: "Tourist visa requirements for Indonesia...",
  },
  {
    source: "immigration_guide.pdf",
    page: 12,
    match_score: 0.87,
    content: "Visa application process and documentation...",
  },
]

// Mock AI responses based on keywords
const MOCK_RESPONSES: Record<string, string> = {
  visa: `Untuk mengajukan visa turis Indonesia, Anda memerlukan beberapa dokumen penting:

1. Paspor yang berlaku minimal 6 bulan
2. Foto ukuran 4x6 cm (2 lembar)
3. Bukti pemesanan tiket pesawat pulang-pergi
4. Bukti akomodasi (reservasi hotel)
5. Bukti keuangan (rekening bank 3 bulan terakhir)

Proses pengajuan biasanya memakan waktu 3-5 hari kerja. Anda dapat mengajukan visa melalui kedutaan Indonesia terdekat atau melalui sistem visa on arrival di bandara tertentu.`,

  tax: `Sistem pajak di Indonesia untuk expatriate mencakup:

1. PPh 21 (Pajak Penghasilan) - 5% sampai 35% tergantung penghasilan
2. PPN (Pajak Pertambahan Nilai) - 11%
3. NPWP (Nomor Pokok Wajib Pajak) wajib untuk pekerja asing

Untuk informasi lebih detail tentang kewajiban pajak Anda, saya sarankan berkonsultasi dengan konsultan pajak yang terdaftar.`,

  default: `Terima kasih atas pertanyaan Anda. Saya adalah ZANTARA AI, asisten virtual yang siap membantu Anda dengan informasi tentang visa, pajak, hukum, dan berbagai layanan Indonesia lainnya.

Bagaimana saya bisa membantu Anda hari ini?`,
}

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes("visa") || lowerMessage.includes("visto")) return "visa_inquiry"
  if (lowerMessage.includes("tax") || lowerMessage.includes("pajak")) return "tax_inquiry"
  if (lowerMessage.includes("legal") || lowerMessage.includes("hukum")) return "legal_inquiry"
  return "general_inquiry"
}

function getResponseForIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes("visa") || lowerMessage.includes("visto")) return MOCK_RESPONSES.visa
  if (lowerMessage.includes("tax") || lowerMessage.includes("pajak")) return MOCK_RESPONSES.tax
  return MOCK_RESPONSES.default
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    const intent = detectIntent(message)
    const useRAG = intent === "visa_inquiry" || intent === "tax_inquiry"

    console.log("[v0] Mock chat stream:", { message, intent, useRAG })

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send metadata block first
        const metadata = {
          memory_used: true,
          rag_sources: useRAG ? MOCK_RAG_SOURCES : [],
          intent,
          model_used: "gpt-4o-mini",
        }

        const metadataBlock = `[METADATA]${JSON.stringify(metadata)}[METADATA]`
        controller.enqueue(encoder.encode(metadataBlock))

        // Stream response character by character
        const response = getResponseForIntent(message)

        for (let i = 0; i < response.length; i++) {
          controller.enqueue(encoder.encode(response[i]))
          // Simulate typing speed
          await new Promise((resolve) => setTimeout(resolve, 20))
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("[v0] Mock chat stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
