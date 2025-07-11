export interface EmailRequest {
  to: string
  from: string
  subject: string
  body: string
  html?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailStatus {
  id: string
  status: "pending" | "sent" | "failed" | "retrying"
  provider?: string
  attempts: number
  error?: string
  timestamp: string
}

export interface IEmailProvider {
  name: string
  sendEmail(request: EmailRequest): Promise<EmailResult>
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  recoveryTimeout: number
  monitorTimeout: number
}

export interface RateLimiterOptions {
  requests: number
  windowMs: number
}
