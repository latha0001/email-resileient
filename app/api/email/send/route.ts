import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"
import { MockEmailProviderA, MockEmailProviderB } from "@/lib/providers/mock-providers"

const emailService = new EmailService([new MockEmailProviderA(), new MockEmailProviderB()])

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 })
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      body,
      from: "noreply@example.com",
    })

    return NextResponse.json({
      success: true,
      status: result,
    })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
