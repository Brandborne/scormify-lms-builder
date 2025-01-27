import { useCallback } from "react";

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  let timeoutId: NodeJS.Timeout;

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}