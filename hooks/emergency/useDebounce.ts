// 🚨 EMERGENCY DEBOUNCING HOOK
// Prevent excessive API calls that are killing performance

import { useRef, useCallback } from 'react';

interface DebounceOptions {
  delay?: number;
  immediate?: boolean;
}

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions = {}
): T {
  const { delay = 300, immediate = false } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  callbackRef.current = callback;

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const callNow = immediate && !timeoutRef.current;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        if (!immediate) {
          callbackRef.current(...args);
        }
      }, delay);
      
      if (callNow) {
        callbackRef.current(...args);
      }
    },
    [delay, immediate]
  ) as T;

  return debouncedCallback;
}

// Specialized debounce hooks for common use cases
export function useSearchDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  return useDebounce(callback, { delay });
}

export function useApiCallDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): T {
  return useDebounce(callback, { delay });
}

export function useFormValidationDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  return useDebounce(callback, { delay });
}

