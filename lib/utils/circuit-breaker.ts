import type { CircuitBreakerOptions } from "../types"

enum CircuitBreakerState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private nextAttemptTime = 0
  private options: CircuitBreakerOptions

  constructor(options: CircuitBreakerOptions) {
    this.options = options
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error("Circuit breaker is OPEN")
    }

    if (this.isHalfOpen()) {
      try {
        const result = await operation()
        this.onSuccess()
        return result
      } catch (error) {
        this.onFailure()
        throw error
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  isOpen(): boolean {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CircuitBreakerState.HALF_OPEN
        return false
      }
      return true
    }
    return false
  }

  isHalfOpen(): boolean {
    return this.state === CircuitBreakerState.HALF_OPEN
  }

  isClosed(): boolean {
    return this.state === CircuitBreakerState.CLOSED
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = CircuitBreakerState.CLOSED
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN
      this.nextAttemptTime = Date.now() + this.options.recoveryTimeout
    }
  }

  getState(): string {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }

  reset(): void {
    this.failureCount = 0
    this.state = CircuitBreakerState.CLOSED
    this.lastFailureTime = 0
    this.nextAttemptTime = 0
  }
}
