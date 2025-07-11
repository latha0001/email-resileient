import { RateLimiter } from "../lib/utils/rate-limiter"

describe("RateLimiter", () => {
  test("should allow requests within limit", () => {
    const limiter = new RateLimiter(5, 1000) // 5 requests per second

    for (let i = 0; i < 5; i++) {
      expect(limiter.isAllowed()).toBe(true)
    }
  })

  test("should block requests over limit", () => {
    const limiter = new RateLimiter(2, 1000) // 2 requests per second

    expect(limiter.isAllowed()).toBe(true)
    expect(limiter.isAllowed()).toBe(true)
    expect(limiter.isAllowed()).toBe(false)
  })

  test("should reset after time window", async () => {
    const limiter = new RateLimiter(1, 100) // 1 request per 100ms

    expect(limiter.isAllowed()).toBe(true)
    expect(limiter.isAllowed()).toBe(false)

    // Wait for window to reset
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(limiter.isAllowed()).toBe(true)
  })

  test("should provide accurate status", () => {
    const limiter = new RateLimiter(3, 1000)

    limiter.isAllowed() // Use 1
    limiter.isAllowed() // Use 2

    const status = limiter.getStatus()
    expect(status.remaining).toBe(1)
  })

  test("should reset manually", () => {
    const limiter = new RateLimiter(1, 1000)

    expect(limiter.isAllowed()).toBe(true)
    expect(limiter.isAllowed()).toBe(false)

    limiter.reset()

    expect(limiter.isAllowed()).toBe(true)
  })
})
