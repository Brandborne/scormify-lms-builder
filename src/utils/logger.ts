export function logDebug(message: string, ...args: any[]) {
  console.log(`[DEBUG] ${message}`, ...args);
}

export function logError(message: string, ...args: any[]) {
  console.error(`[ERROR] ${message}`, ...args);
}

export function logInfo(message: string, ...args: any[]) {
  console.info(`[INFO] ${message}`, ...args);
}

export function logWarning(message: string, ...args: any[]) {
  console.warn(`[WARNING] ${message}`, ...args);
}