import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"
import { MockEmailProviderA, MockEmailProviderB } from "@/lib/providers/mock-providers"

const emailService = new EmailService([new MockEmailProviderA(), new MockEmailProviderB()])

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const status = emailService.getEmailStatus(params.id)

    if (!status) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching email status:", error)
    return NextResponse.json({ error: "Failed to fetch email status" }, { status: 500 })
  }
}
