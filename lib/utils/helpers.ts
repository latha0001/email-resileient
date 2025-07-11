import crypto from "crypto"

export function generateId(content?: string): string {
  if (content) {
    return crypto.createHash("md5").update(content).digest("hex").substring(0, 16)
  }
  return crypto.randomBytes(8).toString("hex")
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function retry<T>(operation: () => Promise<T>, maxAttempts: number, baseDelay = 1000): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation()
        resolve(result)
        return
      } catch (error) {
        lastError = error as Error

        if (attempt === maxAttempts) {
          reject(lastError)
          return
        }

        const delay = baseDelay * Math.pow(2, attempt - 1)
        await sleep(delay)
      }
    }
  })
}
