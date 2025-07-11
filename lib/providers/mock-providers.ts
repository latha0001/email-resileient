import type { IEmailProvider, EmailRequest, EmailResult } from "../types"

export class MockEmailProviderA implements IEmailProvider {
  name = "MockProviderA"
  private failureRate = 0.3 // 30% failure rate for testing

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    // Simulate network delay
    await this.delay(100 + Math.random() * 200)

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      throw new Error(`${this.name}: Simulated network error`)
    }

    return {
      success: true,
      messageId: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export class MockEmailProviderB implements IEmailProvider {
  name = "MockProviderB"
  private failureRate = 0.2 // 20% failure rate for testing

  async sendEmail(request: EmailRequest): Promise<EmailResult> {
    // Simulate network delay
    await this.delay(150 + Math.random() * 300)

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      throw new Error(`${this.name}: Simulated service unavailable`)
    }

    return {
      success: true,
      messageId: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
