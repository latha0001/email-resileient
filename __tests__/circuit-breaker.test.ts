import { CircuitBreaker } from "../lib/utils/circuit-breaker"
import jest from "jest"

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitorTimeout: 500,
    })
  })

  test("should start in closed state", () => {
    expect(circuitBreaker.isClosed()).toBe(true)
    expect(circuitBreaker.isOpen()).toBe(false)
  })

  test("should execute successful operations", async () => {
    const operation = jest.fn().mockResolvedValue("success")

    const result = await circuitBreaker.execute(operation)

    expect(result).toBe("success")
    expect(operation).toHaveBeenCalledTimes(1)
  })

  test("should open after threshold failures", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("failure"))

    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation)
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.isOpen()).toBe(true)
    expect(circuitBreaker.getFailureCount()).toBe(3)
  })

  test("should reject immediately when open", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("failure"))

    // Trigger circuit breaker to open
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation)
      } catch (error) {
        // Expected to fail
      }
    }

    // Should reject immediately without calling operation
    await expect(circuitBreaker.execute(operation)).rejects.toThrow("Circuit breaker is OPEN")
    expect(operation).toHaveBeenCalledTimes(3) // Only the initial failures
  })

  test("should transition to half-open after timeout", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("failure"))

    // Open the circuit breaker
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation)
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.isOpen()).toBe(true)

    // Wait for recovery timeout
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Should now be half-open (not open)
    expect(circuitBreaker.isOpen()).toBe(false)
  })

  test("should reset failure count on success", async () => {
    const failingOperation = jest.fn().mockRejectedValue(new Error("failure"))
    const successOperation = jest.fn().mockResolvedValue("success")

    // Fail twice (below threshold)
    for (let i = 0; i < 2; i++) {
      try {
        await circuitBreaker.execute(failingOperation)
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getFailureCount()).toBe(2)

    // Succeed once
    await circuitBreaker.execute(successOperation)

    expect(circuitBreaker.getFailureCount()).toBe(0)
    expect(circuitBreaker.isClosed()).toBe(true)
  })

  test("should reset manually", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("failure"))

    // Open the circuit breaker
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation)
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.isOpen()).toBe(true)

    circuitBreaker.reset()

    expect(circuitBreaker.isClosed()).toBe(true)
    expect(circuitBreaker.getFailureCount()).toBe(0)
  })
})
