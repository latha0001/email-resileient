import { EmailService } from "../lib/email-service.js"
import { MockEmailProviderA, MockEmailProviderB } from "../lib/providers/mock-providers.js"

async function testEmailService() {
  console.log(" Testing Resilient Email Service\n")
  const emailService = new EmailService([new MockEmailProviderA(), new MockEmailProviderB()])
  console.log("Test 1: Basic Email Sending")
  try {
    const result = await emailService.sendEmail({
      to: "test@example.com",
      from: "sender@example.com",
      subject: "Test Email",
      body: "This is a test email",
    })
    console.log(" Email queued:", result.id)
  } catch (error) {
    console.log(" Error:", error.message)
  }
  console.log("\nTest 2: Rate Limiting")
  const promises = []
  for (let i = 0; i < 15; i++) {
    promises.push(
      emailService
        .sendEmail({
          to: `test${i}@example.com`,
          from: "sender@example.com",
          subject: `Test Email ${i}`,
          body: `This is test email number ${i}`,
        })
        .catch((error) => ({ error: error.message })),
    )
  }

  const results = await Promise.all(promises)
  const successful = results.filter((r) => !r.error).length
  const rateLimited = results.filter((r) => r.error?.includes("Rate limit")).length
  console.log(`Successful: ${successful}`)
  console.log(`Rate limited: ${rateLimited}`)
  console.log("\nTest 3: Idempotency")
  const emailRequest = {
    to: "duplicate@example.com",
    from: "sender@example.com",
    subject: "Duplicate Test",
    body: "This should not be sent twice",
  }

  const first = await emailService.sendEmail(emailRequest)
  const second = await emailService.sendEmail(emailRequest)
  console.log("First send ID:", first.id)
  console.log("Second send ID:", second.id)
  console.log("Same ID (idempotent):", first.id === second.id ? "" : "")
  console.log("\nTest 4: Status Tracking")
  setTimeout(() => {
    const statuses = emailService.getAllEmailStatuses()
    console.log(`Total emails tracked: ${statuses.length}`)
    const statusCounts = statuses.reduce((acc, status) => {
      acc[status.status] = (acc[status.status] || 0) + 1
      return acc
    }, {})

    console.log("Status breakdown:", statusCounts)
  }, 2000)

  console.log("\nTest 5: Provider Health")
  setTimeout(() => {
    const health = emailService.getProviderHealth()
    console.log("Provider health:", health)

    const rateLimitStatus = emailService.getRateLimitStatus()
    console.log("Rate limit status:", rateLimitStatus)
  }, 3000)
}
testEmailService().catch(console.error)
