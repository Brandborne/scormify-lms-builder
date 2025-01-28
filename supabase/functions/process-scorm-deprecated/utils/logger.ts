export function logInfo(message: string, data?: any): void {
  console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export function logError(message: string, error?: any): void {
  console.error(`[ERROR] ${message}`, error);
}

export function logDebug(message: string, data?: any): void {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

export function logWarning(message: string, data?: any): void {
  console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}