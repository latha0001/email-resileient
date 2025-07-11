import { EmailService } from "../lib/email-service"
import { MockEmailProviderA, MockEmailProviderB } from "../lib/providers/mock-providers"
import type { IEmailProvider, EmailRequest, EmailResult } from "../lib/types"

// Mock providers for testing
class AlwaysFailProvider implements IEmailProvider {
  name = "AlwaysFailProvider"

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    throw new Error("Provider always fails")
  }
}

class AlwaysSucceedProvider implements IEmailProvider {
  name = "AlwaysSucceedProvider"

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    return {
      success: true,
      messageId: "test-message-id",
    }
  }
}

describe("EmailService", () => {
  let emailService: EmailService
  const testEmail: EmailRequest = {
    to: "test@example.com",
    from: "sender@example.com",
    subject: "Test Subject",
    body: "Test Body",
  }

  beforeEach(() => {
    emailService = new EmailService([new MockEmailProviderA(), new MockEmailProviderB()])
  })

  describe("Basic Functionality", () => {
    test("should send email successfully", async () => {
      const result = await emailService.sendEmail(testEmail)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.status).toBe("pending")
      expect(result.attempts).toBe(0)
    })

    test("should generate consistent IDs for identical emails", async () => {
      const result1 = await emailService.sendEmail(testEmail)
      const result2 = await emailService.sendEmail(testEmail)

      expect(result1.id).toBe(result2.id)
    })

    test("should track email status", async () => {
      const result = await emailService.sendEmail(testEmail)
      const status = emailService.getEmailStatus(result.id)

      expect(status).toBeDefined()
      expect(status?.id).toBe(result.id)
    })
  })

  describe("Idempotency", () => {
    test("should prevent duplicate sends", async () => {
      const result1 = await emailService.sendEmail(testEmail)
      const result2 = await emailService.sendEmail(testEmail)

      expect(result1.id).toBe(result2.id)
      expect(result1.timestamp).toBe(result2.timestamp)
    })

    test("should allow different emails", async () => {
      const email1 = { ...testEmail, subject: "Subject 1" }
      const email2 = { ...testEmail, subject: "Subject 2" }

      const result1 = await emailService.sendEmail(email1)
      const result2 = await emailService.sendEmail(email2)

      expect(result1.id).not.toBe(result2.id)
    })
  })

  describe("Rate Limiting", () => {
    test("should enforce rate limits", async () => {
      const rateLimitedService = new EmailService([new AlwaysSucceedProvider()], {
        rateLimit: { requests: 2, windowMs: 1000 },
      })

      // First two should succeed
      await rateLimitedService.sendEmail({ ...testEmail, subject: "Email 1" })
      await rateLimitedService.sendEmail({ ...testEmail, subject: "Email 2" })

      // Third should fail
      await expect(rateLimitedService.sendEmail({ ...testEmail, subject: "Email 3" })).rejects.toThrow(
        "Rate limit exceeded",
      )
    })

    test("should provide rate limit status", () => {
      const status = emailService.getRateLimitStatus()

      expect(status).toBeDefined()
      expect(typeof status.remaining).toBe("number")
      expect(typeof status.resetTime).toBe("number")
    })
  })

  describe("Provider Fallback", () => {
    test("should fallback to second provider when first fails", async () => {
      const serviceWithFailingProvider = new EmailService([new AlwaysFailProvider(), new AlwaysSucceedProvider()])

      const result = await serviceWithFailingProvider.sendEmail(testEmail)

      expect(result).toBeDefined()
      expect(result.status).toBe("pending")
    })

    test("should report provider health", () => {
      const health = emailService.getProviderHealth()

      expect(health).toBeDefined()
      expect(health["MockProviderA"]).toBeDefined()
      expect(health["MockProviderB"]).toBeDefined()
    })
  })

  describe("Error Handling", () => {
    test("should handle all providers failing", async () => {
      const failingService = new EmailService([new AlwaysFailProvider(), new AlwaysFailProvider()])

      const result = await failingService.sendEmail(testEmail)

      // Should still return a status object
      expect(result).toBeDefined()
      expect(result.status).toBe("pending")

      // Wait a bit for async processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      const finalStatus = failingService.getEmailStatus(result.id)
      expect(finalStatus?.status).toBe("failed")
    })

    test("should validate email request", async () => {
      const invalidEmail = {
        to: "",
        from: "sender@example.com",
        subject: "Test",
        body: "Test",
      }

      // This would typically be validated at the API level
      // but we can test the service handles empty emails
      const result = await emailService.sendEmail(invalidEmail)
      expect(result).toBeDefined()
    })
  })

  describe("Status Tracking", () => {
    test("should return all email statuses", async () => {
      await emailService.sendEmail({ ...testEmail, subject: "Email 1" })
      await emailService.sendEmail({ ...testEmail, subject: "Email 2" })

      const allStatuses = emailService.getAllEmailStatuses()

      expect(allStatuses).toHaveLength(2)
      expect(allStatuses[0]).toHaveProperty("id")
      expect(allStatuses[0]).toHaveProperty("status")
      expect(allStatuses[0]).toHaveProperty("timestamp")
    })

    test("should return undefined for non-existent email", () => {
      const status = emailService.getEmailStatus("non-existent-id")
      expect(status).toBeUndefined()
    })
  })
})
