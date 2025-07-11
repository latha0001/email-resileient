export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(): boolean {
    const now = Date.now()

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    if (this.requests.length >= this.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  getStatus(): { remaining: number; resetTime: number } {
    const now = Date.now()
    this.requests = this.requests.filter((time) => now - time < this.windowMs)

    const remaining = Math.max(0, this.maxRequests - this.requests.length)
    const oldestRequest = this.requests[0]
    const resetTime = oldestRequest ? oldestRequest + this.windowMs : now

    return { remaining, resetTime }
  }

  reset(): void {
    this.requests = []
  }
}
