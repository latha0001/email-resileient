import type { IEmailProvider, EmailRequest, EmailStatus } from "./types"
import { RateLimiter } from "./utils/rate-limiter"
import { CircuitBreaker } from "./utils/circuit-breaker"
import { Logger } from "./utils/logger"
import { generateId } from "./utils/helpers"

export class EmailService {
  private providers: IEmailProvider[]
  private emailStatuses: Map<string, EmailStatus> = new Map()
  private rateLimiter: RateLimiter
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private logger: Logger
  private sentEmails: Set<string> = new Set() 
  constructor(
    providers: IEmailProvider[],
    options: {
      maxRetries?: number
      baseDelay?: number
      rateLimit?: { requests: number; windowMs: number }
    } = {},
  ) {
    this.providers = providers
    this.rateLimiter = new RateLimiter(options.rateLimit?.requests || 10, options.rateLimit?.windowMs || 60000)
    this.logger = new Logger()
    this.providers.forEach((provider) => {
      this.circuitBreakers.set(
        provider.name,
        new CircuitBreaker({
          failureThreshold: 5,
          recoveryTimeout: 30000,
          monitorTimeout: 5000,
        }),
      )
    })
  }

  async sendEmail(request: EmailRequest): Promise<EmailStatus> {
    const emailId = this.generateEmailId(request)
    if (this.sentEmails.has(emailId)) {
      const existingStatus = this.emailStatuses.get(emailId)
      if (existingStatus) {
        this.logger.info(`Duplicate email request ignored: ${emailId}`)
        return existingStatus
      }
    }
    if (!this.rateLimiter.isAllowed()) {
      const status: EmailStatus = {
        id: emailId,
        status: "failed",
        error: "Rate limit exceeded",
        attempts: 0,
        timestamp: new Date().toISOString(),
      }
      this.emailStatuses.set(emailId, status)
      throw new Error("Rate limit exceeded")
    }

    const status: EmailStatus = {
      id: emailId,
      status: "pending",
      attempts: 0,
      timestamp: new Date().toISOString(),
    }

    this.emailStatuses.set(emailId, status)
    this.logger.info(`Starting email send: ${emailId}`)
    this.processSendEmail(request, status)

    return status
  }

  private async processSendEmail(request: EmailRequest, status: EmailStatus): Promise<void> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      status.attempts = attempt
      status.status = attempt > 1 ? "retrying" : "pending"
      this.emailStatuses.set(status.id, { ...status })

      for (const provider of this.providers) {
        const circuitBreaker = this.circuitBreakers.get(provider.name)!

        if (circuitBreaker.isOpen()) {
          this.logger.warn(`Circuit breaker open for provider: ${provider.name}`)
          continue
        }

        try {
          this.logger.info(`Attempting send with ${provider.name}, attempt ${attempt}`)

          const result = await circuitBreaker.execute(() => provider.sendEmail(request))

          if (result.success) {
            status.status = "sent"
            status.provider = provider.name
            status.timestamp = new Date().toISOString()
            this.emailStatuses.set(status.id, { ...status })
            this.sentEmails.add(status.id)

            this.logger.info(`Email sent successfully: ${status.id} via ${provider.name}`)
            return
          } else {
            throw new Error(result.error || "Unknown provider error")
          }
        } catch (error) {
          lastError = error as Error
          this.logger.error(`Provider ${provider.name} failed:`, error)
          if (provider === this.providers[this.providers.length - 1] && attempt < maxRetries) {
            const delay = this.calculateBackoffDelay(attempt)
            this.logger.info(`Waiting ${delay}ms before retry ${attempt + 1}`)
            await this.sleep(delay)
          }
        }
      }
    }
    status.status = "failed"
    status.error = lastError?.message || "All providers failed"
    status.timestamp = new Date().toISOString()
    this.emailStatuses.set(status.id, { ...status })
    this.logger.error(`Email failed after all attempts: ${status.id}`)
  }

  getEmailStatus(emailId: string): EmailStatus | undefined {
    return this.emailStatuses.get(emailId)
  }

  getAllEmailStatuses(): EmailStatus[] {
    return Array.from(this.emailStatuses.values())
  }

  private generateEmailId(request: EmailRequest): string {
    const content = `${request.to}-${request.subject}-${request.body}`
    return generateId(content)
  }

  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000 
    const maxDelay = 30000 
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
    return delay + Math.random() * 1000
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getProviderHealth(): Record<string, { isHealthy: boolean; isOpen: boolean }> {
    const health: Record<string, { isHealthy: boolean; isOpen: boolean }> = {}

    this.providers.forEach((provider) => {
      const circuitBreaker = this.circuitBreakers.get(provider.name)!
      health[provider.name] = {
        isHealthy: !circuitBreaker.isOpen(),
        isOpen: circuitBreaker.isOpen(),
      }
    })

    return health
  }

  getRateLimitStatus(): { remaining: number; resetTime: number } {
    return this.rateLimiter.getStatus()
  }
}
