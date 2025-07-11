export class Logger {
  private logLevel: "debug" | "info" | "warn" | "error" = "info"

  setLogLevel(level: "debug" | "info" | "warn" | "error"): void {
    this.logLevel = level
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${new Date().toISOString()} - ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args)
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"]
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }
}
